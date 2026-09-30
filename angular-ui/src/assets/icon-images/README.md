这个目录中的svg文件是组件 svg-icon 中需要用到的，用法如下

```
<svg-icon
    [name]="'x'"
    [svgSrcPath]="'assets/icon-images/'"
></svg-icon>
```

name 为文件名（去后缀）

图标来自
https://lucide.dev/icons/

只保留当前用到的图标；需要新图标时去网站下载 svg 放入本目录，然后执行以下命令重新生成图标清单
（icon-showcase 展示页和 `src/generated/icon-list.ts` 由该清单驱动）：

```
node scripts/generate-icon-list.mjs
```
