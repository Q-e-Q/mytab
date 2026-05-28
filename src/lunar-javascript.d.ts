/**
 * lunar-javascript 的类型声明文件
 * 由于该库没有官方 .d.ts 文件，此处手动声明用到的类型
 */
declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar
    getLunar(): Lunar
  }

  export class Lunar {
    getMonthInChinese(): string
    getDayInChinese(): string
  }
}
