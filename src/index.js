import { mkdir,  } from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "node:fs";
import * as stream from "stream";
import { promisify } from "util";
import colors from "@colors/colors";

const finished = promisify(stream.finished);

console.log("Pamela".bgGreen);

const readSiteMap = () => {
    const buffer = fs.readFileSync("c:\\Users\\Guillermo Jimenez\\source\\repos\\iRenew\\MacStore\\sitemap.xml");
    const $ = cheerio.loadBuffer(buffer);

    $("loc").map(async (_, urlSiteMap) => {
        try {
            const response = await axios.get($(urlSiteMap).text());
            if(response.statusText == "OK") {
                createDirectoriesDownload({
                    listURLsTarget : getMediaResources({
                        urlTarget : $(urlSiteMap).text(),
                        urlToFind : "https://webonline.macstore.mx/img/",
                        attrsTarget : ["src", "srcset", "href"],
                    }),
                    dirName: "irenew"
                });
            }
        } catch(error) {
            // console.error(error);
        }
        
        
        
        
    });
}

const downloadResources = async ({ urlResouce, pathToSave }) => {
   
    const writer = fs.createWriteStream(pathToSave, { mode: 0o777 });

    try {
        const response = await axios.get(urlResouce, {
            responseType: "stream"
        });
        response.data.pipe(writer);
        await finished(writer);
    } catch (error) {
        console.error('Error downloading the image:', error);
    }
}

const createDirectoriesDownload = async ({ listURLsTarget, dirName }) => {

    const listURLs = await listURLsTarget;

    listURLs.urlsResourcesTarget.forEach(async (urlTarget) => {
        let arrayURLTargetWithoutLastItem = urlTarget.split("/");
        let nameFile = arrayURLTargetWithoutLastItem.pop();
        let pathFile = "";

        arrayURLTargetWithoutLastItem.forEach((x) => {
            pathFile += x + "/";
        });

        try {
            const folderPath = new URL(`./${ dirName }/${ pathFile }`, import.meta.url);
            const createDir = await mkdir(folderPath, { recursive : true, mode: 0o777 });

            await downloadResources({ urlResouce : listURLs.urlToFindDomain + urlTarget, pathToSave : `./src/${ dirName }/${ pathFile + nameFile }` });

        } catch (error) {
            console.error(error.message);
        }
    });
}

const getMediaResources = async ({ urlTarget, attrsTarget, urlToFind }) => {
    try {
        const response = await axios.get(urlTarget);

        const $ = cheerio.load(response.data);

        let urlsResourcesTarget = [];
        const urlToFindDomain = urlToFind.split("/")[0] + "//" + urlToFind.split("/")[2] + "/"; 

        attrsTarget.forEach(attr => {
            $(`*[${ attr }^=${ urlToFind }]`).map((_, element) => {
                if(attr === "srcset") {
                    let elementAttrURLS = element.attribs[attr].split(",");
                    elementAttrURLS.length > 1 ? [
                        elementAttrURLS.forEach((elementAttrURL) => {
                            urlsResourcesTarget.push(elementAttrURL.replace(urlToFindDomain, "").replaceAll("//", "/").trim());
                        })
                    ] : [
                        urlsResourcesTarget.push(element.attribs[attr].replace(urlToFindDomain, "").replaceAll("//", "/").trim())
                    ];
                } else {
                    urlsResourcesTarget.push(element.attribs[attr].replace(urlToFindDomain, "").replaceAll("//", "/").trim());
                }
            });
        });
    
        return {
            urlsResourcesTarget,
            urlToFindDomain
        }
    } catch (error) {
        console.error(error.message);
    }
}


readSiteMap();
