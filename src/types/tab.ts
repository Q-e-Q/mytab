/** 分组实体 */
export interface Group {
  id: string
  name: string
  icon: string
  order: number
  createdAt: number
}

/** 链接实体 */
export interface Link {
  id: string
  name: string
  url: string
  icon: string
  groupId: string
  order: number
  isAddPlaceholder?: boolean  // 是否为"添加"占位链接
}

/** 搜索引擎 */
export interface SearchEngine {
  label: string
  value: string
  url: string
}
