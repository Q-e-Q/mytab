/**
 * 数据库层：基于 Dexie (IndexedDB) 的数据持久化
 * 负责分组的增删改查和批量排序
 */
import Dexie, { type Table } from 'dexie'       // 引入 Dexie 数据库库和 Table 类型
import type { Group } from '@/types/tab'        // 引入分组类型定义

/** 继承 Dexie 定义数据库表和版本 */
export class MyTabDB extends Dexie {            // 自定义数据库类，继承 Dexie
  groups!: Table<Group, string>                 // groups 表，主键为 string 类型

  constructor() {                               // 构造函数
    super('mytab')                              // 调用父类，数据库名称为 'mytab'
    this.version(1).stores({                    // 定义数据库版本 1
      groups: 'id, order'                       // groups 表：id 为主键，order 为索引
    })
  }
}

export const db = new MyTabDB()                // 创建数据库实例（单例）

/** 分组 CRUD 操作集合 */
export const groupDB = {                        // 封装好的分组数据操作对象

  /** 获取所有分组，按 order 升序排列 */
  async getAll(): Promise<Group[]> {            // 返回分组数组的 Promise
    return db.groups.orderBy('order').toArray() // 按 order 排序后转为数组返回
  },

  /** 添加一个分组 */
  async add(group: Group): Promise<void> {      // 接收一个分组对象
    await db.groups.add(group)                  // 写入 IndexedDB
  },

  /** 更新指定分组的字段 */
  async update(id: string, data: Partial<Group>): Promise<void> { // 按 id 更新部分字段
    await db.groups.update(id, data)            // 调用 Dexie 的 update 方法
  },

  /** 删除指定分组 */
  async delete(id: string): Promise<void> {     // 按 id 删除
    await db.groups.delete(id)                  // 调用 Dexie 的 delete 方法
  },

  /** 批量更新分组排序（在事务中执行，保证数据一致性） */
  async updateOrder(groups: Group[]): Promise<void> { // 接收排序后的分组数组
    await db.transaction('rw', db.groups, async () => { // 读写事务，保证原子性
      for (const group of groups) {              // 遍历每个分组
        await db.groups.update(group.id, { order: group.order }) // 更新 order 字段
      }
    })
  }
}
