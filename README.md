![示例图](screenshot/preview.png)

生成你自己的电影生涯个人喜好表！

标题，名称，全部可以自由定义！

## 快速开始

克隆仓库并安装依赖项：

```bash
git clone https://github.com/janethedev/movie-grid
cd movie-grid
npm install
```

运行开发服务器：

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 配置说明

- **Google Analytics ID**（可选）:
  1. 访问 [Google Analytics](https://analytics.google.com/)
  2. 创建账号并设置数据流
  3. 获取衡量 ID（格式：`G-XXXXXXXXXX`）
  4. 仅在生产环境启用，不配置则不启用追踪

本项目使用 TMDB (The Movie Database) API 进行电影搜索。

### TMDB API 配置

1. 访问 [TMDB 官网](https://www.themoviedb.org/) 注册账号
2. 在账号设置中申请 API Key（免费）
3. 在项目根目录创建 `.env.local` 文件，添加：
   ```bash
   TMDB_API_KEY=你的API密钥
   # 国内本地访问 TMDB 需要配置代理 TMDB，下面端口填代理端口号
   HTTPS_PROXY=http://127.0.0.1:7897
   ```

## 部署

### Vercel 部署（推荐）

1. Fork 本仓库到你的 GitHub 账号
2. 在 [Vercel](https://vercel.com) 导入项目
3. （可选）在项目设置中添加环境变量：
   - `TMDB_API_KEY`
   - `NEXT_PUBLIC_GA_ID`（可选，用于 Google Analytics 追踪）
4. 部署完成

### 其他平台部署

确保在部署平台的环境变量配置中添加上述所有必需的环境变量。Google Analytics ID 为可选配置，不配置则不会启用追踪功能。

## 致谢

本项目基于 [SomiaWhiteRing/game-grid](https://github.com/SomiaWhiteRing/game-grid) 进行开发和修改。

感谢原作者的开源贡献！

## 许可证

MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件
