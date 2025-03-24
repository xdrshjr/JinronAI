# PDF翻译任务接口文档

本文档描述了PDF翻译任务所需的后端API接口。

## 1. 翻译PDF文档

将PDF文档上传并翻译。

**接口地址:** `http://localhost:7860/translate_pdf`

**请求方法:** `POST`

**Content-Type:** `multipart/form-data`

**请求参数:**

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| pdf | File | 是 | 要翻译的PDF文件 |
| service | String | 是 | 翻译服务，可选值: Google、Bing、DeepL、DeepLX、Ollama、OpenAI、Azure、AzureOpenAI、Zhipu、ModelScope、Silicon、Gemini、Tencent、Dify、AnythingLLM、Argos、Grok、Groq、DeepSeek、OpenAI-liked、QwenMt |
| langFrom | String | 是 | 源语言，可选值: Simplified Chinese、Traditional Chinese、English、French、German、Japanese、Korean、Russian、Spanish、Italian |
| langTo | String | 是 | 目标语言，可选值同上 |
| pageRange | String | 是 | 页面范围类型，可选值: All、First、First 5 pages、Others |
| customPages | String | 否 | 自定义页面范围，当pageRange为Others时必填，格式如 "1-5,8,10-12" |
| threads | String | 否 | 线程数，默认为4 |
| skipSubsetFonts | String | 否 | 是否跳过字体子集化，可选值: "true"、"false"，默认为false |
| ignoreCache | String | 否 | 是否忽略缓存，可选值: "true"、"false"，默认为false |
| customPrompt | String | 否 | 自定义提示词，用于LLM翻译 |
| useBabeldoc | String | 否 | 是否使用BabelDOC，可选值: "true"、"false"，默认为false |

**响应格式:** `application/json`

**响应参数:**

```json
{
  "status": "success", // 或 "error"
  "message": "翻译任务已启动",
  "taskId": "12345678-1234-1234-1234-123456789012" // 任务ID
}
```

## 2. 查询翻译状态

查询PDF翻译任务的状态。

**接口地址:** `http://localhost:7860/translate_pdf_status`

**请求方法:** `GET`

**响应格式:** `application/json`

**响应参数:**

```json
{
  "status": "running", // 可能的值: "starting", "running", "completed", "error", "cancelled"
  "progress": 0.45, // 进度，0-1之间的浮点数
  "message": "正在翻译第3页，共10页...",
  "resultFiles": {
    "mono": "filename-mono.pdf", // 单语言结果文件名
    "dual": "filename-dual.pdf" // 双语言结果文件名
  }
}
```

## 3. 取消翻译任务

取消正在进行的PDF翻译任务。

**接口地址:** `http://localhost:7860/cancel_translation`

**请求方法:** `POST`

**响应格式:** `application/json`

**响应参数:**

```json
{
  "status": "success", // 或 "error"
  "message": "翻译任务已取消"
}
```

## 4. 获取已翻译的文件

获取已翻译的PDF文件。

**接口地址:** `http://localhost:7860/files/{filename}`

**请求方法:** `GET`

**路径参数:**

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| filename | String | 文件名，从翻译状态接口返回的resultFiles中获取 |

**响应格式:** `application/pdf`

## 5. 实现说明

该接口应基于pdf2zh库实现，可以参考提供的Python代码进行后端实现。主要的实现步骤包括：

1. 接收前端上传的PDF文件和翻译参数
2. 调用pdf2zh库的translate函数进行翻译
3. 提供状态查询接口，返回翻译进度
4. 提供文件下载接口，返回翻译结果

使用案例请参考PDF翻译任务组件的前端实现。 