### 自定义的icon组件

图标文件位于 `public/icons/` 目录，构建时原样拷贝到 dist，运行时通过请求静态资源按需加载（模块级缓存，同一图标只请求一次），不会打进 JS 包。

注意，为了区分icon的类型，可以放置到特定文件夹内，icon名使用文件夹名称path，例如放入到sys文件夹中的test.svg，你只能使用svg:sys/test.svg去访问该icon。

其中 `public/icons/svgs/` 文件夹中放置svg资源，以 `svg:` 前缀访问，组件请求svg内容后内联渲染，颜色跟随外部 color 属性。
其中 `public/icons/imgs/` 文件夹中放置图片jpg,png,svg资源，以 `img:` 前缀访问，img标签直接加载静态地址，可以保持图片色彩。

`svgs/` 中的线性图标统一来自 [lucide](https://lucide.dev)（npm 包 `lucide-static`，取 `icons/` 目录下的同名文件），品牌图标来自 [simple-icons](https://simpleicons.org)，缺什么就从对应网站下载，保持文件名与官方一致。

新增或删除图标后，执行 `node scripts/generate-icon-list.mjs` 更新 `src/generated/icon-list.ts`（图标名称清单，供图标列表展示页使用；不更新也不影响图标渲染，只影响列表页展示）。

png转svg可以使用其他插件转换
