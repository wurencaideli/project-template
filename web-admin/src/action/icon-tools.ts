import axios from 'axios';

import { getBuildBase } from '~/common/common-tools.ts';

const baseUrl = getBuildBase();
const svgCacheMap = new Map();

export function getIconUrl(name: string) {
    if (name && name.startsWith('svg:')) {
        return baseUrl + '/icons/svgs/' + name.replace('svg:', '');
    }
    if (name && name.startsWith('img:')) {
        return baseUrl + '/icons/imgs/' + name.replace('img:', '');
    }
    return '';
}

export async function getSvgContent(name: string) {
    const url = getIconUrl(name);
    if (!url || !name.startsWith('svg:')) return '';
    if (svgCacheMap.has(url)) {
        return svgCacheMap.get(url);
    }
    try {
        const response = await axios.get(url, { responseType: 'text' });
        const svg = sanitizeSvg(String(response.data));
        svgCacheMap.set(url, svg);
        return svg;
    } catch {
        return '';
    }
}

export function sanitizeSvg(svg: string) {
    return svg
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '')
        .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
        .replace(/href="javascript:[^"]*"/gi, '')
        .replace(/xlink:href="javascript:[^"]*"/gi, '');
}
