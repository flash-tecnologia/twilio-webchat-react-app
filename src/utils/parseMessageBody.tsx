import { ReactElement } from "react";
import { Anchor } from "@twilio-paste/core/anchor";
import { Text } from "@twilio-paste/core/text";

const protocol = "((?:http|https|rtsp):\\/\\/)";
const domainAndSubdomains = "(?:(?:[a-zA-Z0-9][-]*)*[a-zA-Z0-9]\\.)+";
const genericTopLevelDomains =
    "aero|arpa|asia|app|" +
    "biz|buzz|" +
    "cat|com|coop|credit|" +
    "edu|" +
    "gov|" +
    "info|int|" +
    "jobs|" +
    "mil|mobi|museum|" +
    "name|net|" +
    "org|" +
    "pro|" +
    "tel|travel";
const countryTopLevelDomains =
    "a[cdefgilmnoqrstuwxz]|" +
    "b[abdefghijlmnoqrstvwyz]|" +
    "c[acdfghiklmnoruvwxyz]|" +
    "d[ejkmoz]|" +
    "e[ceghrstu]|" +
    "f[ijkmor]|" +
    "g[abdefghilmnpqrstuwy]|" +
    "h[kmnrtu]|" +
    "i[delmnoqrst]|" +
    "j[emop]|" +
    "k[eghimnprwyz]|" +
    "l[abcikrstuvy]|" +
    "m[acdefghklmnopqrstuvwxyz]|" +
    "n[acefgilopruz]|" +
    "om|" +
    "p[aefghklmnrstwy]|" +
    "qa|" +
    "r[eosuw]|" +
    "s[abcdeghijklmnorstuvxyz]|" +
    "t[cdfghjklmnoprtvwz]|" +
    "u[agkmsyz]|" +
    "v[aceginu]|" +
    "w[fs]|" +
    "y[etu]|" +
    "z[amw]";
const port = "(?:\\:\\d{1,5})?";
const path = '(?:[/?#][^\\s"]*)?';
const startOfMatchedUrl = "(?:\\b|^)";
const endOfMatchedUrl = "(?:\\b|$)";

const urlRegexString = `${startOfMatchedUrl}(?:${protocol}\\S+|(?:${protocol})?${domainAndSubdomains}(?:${genericTopLevelDomains}|${countryTopLevelDomains})${port}${path})${endOfMatchedUrl}`;
const urlRegex = new RegExp(urlRegexString, "gi");
const asteriskRegex = /\*([^*]+)\*/g;

const parseFormatting = (text: string, keyPrefix: string): Array<ReactElement | string> => {
    const result: Array<ReactElement | string> = [];
    let index = 0;
    let regexResult;
    
    while ((regexResult = asteriskRegex.exec(text))) {
        if (regexResult.index > index) {
            result.push(text.substring(index, regexResult.index));
        }
        
        result.push(
            <Text as="span" fontWeight="fontWeightBold" color="inherit" key={`${keyPrefix}-bold-${index}`}>
                {regexResult[1]}
            </Text>
        );
        
        index = regexResult.index + regexResult[0].length;
    }
    
    if (index < text.length) {
        result.push(text.substring(index));
    }
    
    return result.length > 0 ? result : [text];
};

export const parseMessageBody = (body: string, belongToCurrentUser: boolean) => {
    const renderedResult: Array<ReactElement | string> = [];

    const lineBreakRegexp = new RegExp(/[\n\r]/);
    const lines = body.split(lineBreakRegexp);
    lines.forEach((line, lineIndex) => {
        let index = 0;
        let regexResult;

        while ((regexResult = urlRegex.exec(line))) {
            const textBefore = line.substring(index, regexResult.index);
            if (textBefore) {
                const formattedText = parseFormatting(textBefore, `line-${lineIndex}-before-${index}`);
                renderedResult.push(...formattedText);
            }

            const [url, urlProtocol] = regexResult;
            const urlHref = urlProtocol ? url : `http://${url}`;
            renderedResult.push(
                <Anchor href={urlHref} key={`line-${lineIndex}-url-${index}`} variant={belongToCurrentUser ? "inverse" : "default"}>
                    {url}
                </Anchor>
            );
            index = regexResult.index + regexResult[0].length;
        }

        if (index < line.length) {
            const textAfter = line.substring(index, line.length);
            const formattedText = parseFormatting(textAfter, `line-${lineIndex}-after-${index}`);
            renderedResult.push(...formattedText);
        }

        renderedResult.push("\n");
    });

    renderedResult.pop();

    return renderedResult;
};