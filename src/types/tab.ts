/** 分组类型：侧边栏中每个卡片对应一个分组 */
export interface Group {
  id: string          // 唯一标识，使用 crypto.randomUUID() 生成
  name: string        // 分组名称
  icon: string        // 图标名称（对应 Element Plus 图标组件名，如 'Folder'、'Star'）
  order: number       // 排序序号，用于拖拽排序
  createdAt: number   // 创建时间戳
}
