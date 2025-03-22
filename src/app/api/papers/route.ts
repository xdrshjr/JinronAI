import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// 论文接口定义
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
  citations?: number;
  published: string;
  updated: string;
  categories: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const maxResults = searchParams.get('max_results') || '10';
  const startYear = searchParams.get('start_year');
  const endYear = searchParams.get('end_year');
  const repositoryType = searchParams.get('repository') || 'arxiv'; // 默认使用arxiv
  const sortBy = searchParams.get('sort_by') || 'relevance'; // 可选值: 'relevance', 'lastUpdatedDate', 'submittedDate'
  const startIndex = searchParams.get('start_index') || '0'; // 用于分页
  
  if (!query) {
    return NextResponse.json(
      { error: '查询参数不能为空' },
      { status: 400 }
    );
  }
  
  try {
    let papers: Paper[] = [];
    
    // 目前仅支持arXiv，未来可以扩展到其他库
    if (repositoryType.toLowerCase() === 'arxiv') {
      papers = await searchArxiv(
        query, 
        parseInt(maxResults), 
        parseInt(startIndex), 
        sortBy, 
        startYear ? parseInt(startYear) : undefined, 
        endYear ? parseInt(endYear) : undefined
      );
    } else {
      return NextResponse.json(
        { error: `不支持的仓库类型: ${repositoryType}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      papers, 
      total: papers.length, 
      has_more: papers.length >= parseInt(maxResults) 
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: '获取论文失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// 从arXiv搜索论文
async function searchArxiv(
  query: string, 
  maxResults: number = 10,
  startIndex: number = 0,
  sortBy: string = 'relevance',
  startYear?: number,
  endYear?: number
): Promise<Paper[]> {
  // 构建基本查询
  let searchQuery = `all:${encodeURIComponent(query.trim())}`;
  
  // 添加年份过滤器（如果提供）
  if (startYear || endYear) {
    // 在arXiv中，通过日期过滤来近似年份过滤
    if (startYear) {
      searchQuery += `+AND+submittedDate:[${startYear}0101+TO+`;
      searchQuery += endYear ? `${endYear}1231]` : `${new Date().getFullYear()}1231]`;
    } else if (endYear) {
      searchQuery += `+AND+submittedDate:[00010101+TO+${endYear}1231]`;
    }
  }
  
  // 确定排序方式
  let arxivSortBy = 'relevance';
  if (sortBy === 'lastUpdatedDate') {
    arxivSortBy = 'lastUpdatedDate';
  } else if (sortBy === 'submittedDate') {
    arxivSortBy = 'submittedDate';
  }
  
  // 构建Arxiv API URL
  const url = `http://export.arxiv.org/api/query?search_query=${searchQuery}&start=${startIndex}&max_results=${maxResults}&sortBy=${arxivSortBy}`;
  
  // 调用Arxiv API
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Arxiv API请求失败: ${response.status}`);
  }
  
  const xmlData = await response.text();
  
  // 解析XML响应
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean) => {
      return name === "entry" || name === "author" || name === "category";
    }
  });
  
  const result = parser.parse(xmlData);
  
  // 提取论文数据
  let papers: Paper[] = [];
  
  if (result.feed.entry && Array.isArray(result.feed.entry)) {
    papers = result.feed.entry.map((entry: any) => {
      // 提取发表年份
      const published = entry.published || '';
      const publishDate = new Date(published);
      const year = publishDate.getFullYear();
      
      // 提取作者列表
      const authors = entry.author ? 
        entry.author.map((author: any) => author.name) : [];
      
      // 提取分类
      const categories = entry.category ? 
        entry.category.map((cat: any) => cat.term) : [];
      
      // 生成论文对象
      return {
        id: entry.id || '',
        title: entry.title?.replace(/\\n/g, ' ').trim() || '',
        authors,
        abstract: entry.summary?.replace(/\\n/g, ' ').trim() || '',
        year,
        url: entry.id || '',
        published: entry.published || '',
        updated: entry.updated || '',
        categories,
        journal: 'arXiv',
        doi: entry.doi || ''
      };
    });
  }
  
  return papers;
} 