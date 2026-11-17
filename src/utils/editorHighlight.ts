import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

/** Syntax-highlights [code] line by line, wrapping the 1-based [errorLine] in a red marker. */
export const highlightCode = (code: string, errorLine?: number): string =>
    code
        .split("\n")
        .map((line, index) => {
            const html = highlight(line, languages.js, "javascript");
            return errorLine !== undefined && index + 1 === errorLine
                ? `<span class="code-error-line">${html}</span>`
                : html;
        })
        .join("\n");
