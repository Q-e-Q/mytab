/**
 * 数据库层：基于 Dexie (IndexedDB) 的数据持久化
 * 负责分组和链接的增删改查
 */
import Dexie, { type Table } from 'dexie'
import type { Group, Link } from '@/types/tab'

/** 继承 Dexie 定义数据库表和版本 */
export class MyTabDB extends Dexie {
  groups!: Table<Group, string>                 // groups 表，主键为 string
  links!: Table<Link, string>                   // links 表，主键为 string

  constructor() {
    super('mytab')
    this.version(2).stores({                    // 升级到版本 2
      groups: 'id, order',                      // groups 表不变
      links: 'id, groupId, order'               // links 表：id 主键，groupId 和 order 为索引
    })
  }
}

export const db = new MyTabDB()

/** 分组 CRUD 操作集合 */
export const groupDB = {
  async getAll(): Promise<Group[]> {
    return db.groups.orderBy('order').toArray()
  },
  async add(group: Group): Promise<void> {
    await db.groups.add(group)
  },
  async update(id: string, data: Partial<Group>): Promise<void> {
    await db.groups.update(id, data)
  },
  async delete(id: string): Promise<void> {
    await db.groups.delete(id)
  },
  async updateOrder(groups: Group[]): Promise<void> {
    await db.transaction('rw', db.groups, async () => {
      for (const group of groups) {
        await db.groups.update(group.id, { order: group.order })
      }
    })
  }
}

/** 链接 CRUD 操作集合 */
export const linkDB = {
  /** 获取指定分组的所有链接，按 order 排序 */
  async getByGroup(groupId: string): Promise<Link[]> {
    return db.links.where('groupId').equals(groupId).sortBy('order')
  },

  /** 添加一个链接 */
  async add(link: Link): Promise<void> {
    await db.links.add(link)
  },

  /** 更新链接 */
  async update(id: string, data: Partial<Link>): Promise<void> {
    await db.links.update(id, data)
  },

  /** 删除链接 */
  async delete(id: string): Promise<void> {
    await db.links.delete(id)
  },

  /** 删除某个分组下的全部链接（删除分组时调用） */
  async deleteByGroup(groupId: string): Promise<void> {
    await db.links.where('groupId').equals(groupId).delete()
  },

  /** 批量更新链接排序（拖拽后调用） */
  async updateOrder(links: Link[]): Promise<void> {
    await db.transaction('rw', db.links, async () => {
      for (const link of links) {
        await db.links.update(link.id, { order: link.order })
      }
    })
  }
}
