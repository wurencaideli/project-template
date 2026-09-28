import UglifyJS from 'uglify-js';
import htmlMinifier from 'html-minifier';

/** 压缩js */
export function compressJs(content: string): string {
    const output = UglifyJS.minify(content, {
        mangle: {
            toplevel: true,
        },
        nameCache: {},
    });
    return output.code;
}
/** 压缩html */
export function compressHtml(content: string) {
    const compressedHTML = htmlMinifier.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        minifyURLs: true,
        minifyJS: (test) => {
            return test;
        },
        minifyCSS: false,
    });
    return compressedHTML;
}
