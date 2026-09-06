import { describe, expect, it } from 'vitest'
import {
  avaColor,
  cleanTelegram,
  countLabel,
  dzoCore,
  initials,
  isValidEmail,
  parseList,
  specShort,
  timeAgo,
  truncate,
} from '../lib/format'

describe('dzoCore', () => {
  it('снимает юридические приставки и кавычки', () => {
    expect(dzoCore('АО «СП «Инкай»')).toBe('Инкай')
    expect(dzoCore('АО «Орталык»')).toBe('Орталык')
    expect(dzoCore('ТОО «СП «Катко»')).toBe('Катко')
  })

  it('убирает скобочные пояснения', () => {
    expect(dzoCore('Головной офис (АО НАК Казатомпром)')).toBe('Головной офис')
  })

  it('ограничивает число слов, когда место в вёрстке ограничено', () => {
    expect(dzoCore('Головной офис Казатомпром', 1)).toBe('Головной')
  })

  it('не падает на пустом значении', () => {
    expect(dzoCore(null)).toBe('')
    expect(dzoCore(undefined)).toBe('')
  })
})

describe('initials', () => {
  it('берёт первые буквы фамилии и имени', () => {
    expect(initials('Ахметов Ерлан Серикович')).toBe('АЕ')
  })
  it('работает с одним словом и с пустым значением', () => {
    expect(initials('Ахметов')).toBe('А')
    expect(initials('')).toBe('?')
  })
})

describe('avaColor', () => {
  it('устойчив: одно имя — всегда один цвет', () => {
    expect(avaColor('Ахметов Ерлан')).toBe(avaColor('Ахметов Ерлан'))
  })

  it('различает имена с одинаковой первой буквой', () => {
    // Прежняя версия брала цвет по первому символу, поэтому все
    // фамилии на «А» выглядели одинаково.
    const colors = new Set(['Ахметов А', 'Абдуллаев Б', 'Алиев В', 'Асанов Г'].map(avaColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('parseList', () => {
  it('режет по запятой и убирает пустые значения', () => {
    expect(parseList('TIA Portal, Profibus,, SCADA ')).toEqual(['TIA Portal', 'Profibus', 'SCADA'])
  })

  it('снимает дубли без учёта регистра — иначе ломались React-ключи', () => {
    expect(parseList('насосы, Насосы, НАСОСЫ')).toEqual(['насосы'])
  })
})

describe('countLabel', () => {
  it('склоняет по-русски', () => {
    expect(countLabel(1, 'ответ', 'ответа', 'ответов')).toBe('1 ответ')
    expect(countLabel(3, 'ответ', 'ответа', 'ответов')).toBe('3 ответа')
    expect(countLabel(11, 'ответ', 'ответа', 'ответов')).toBe('11 ответов')
    expect(countLabel(21, 'ответ', 'ответа', 'ответов')).toBe('21 ответ')
    expect(countLabel(0, 'ответ', 'ответа', 'ответов')).toBe('0 ответов')
  })
})

describe('cleanTelegram', () => {
  it('оставляет только логин', () => {
    expect(cleanTelegram('@user_name')).toBe('user_name')
    expect(cleanTelegram('https://t.me/user_name')).toBe('user_name')
    expect(cleanTelegram('  @user.name!  ')).toBe('username')
  })
})

describe('timeAgo', () => {
  it('показывает относительное время', () => {
    expect(timeAgo(new Date().toISOString())).toBe('сейчас')
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 мин')
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000).toISOString())).toBe('3 ч')
  })
  it('не падает на мусоре', () => {
    expect(timeAgo('не дата')).toBe('')
    expect(timeAgo(null)).toBe('')
  })
})

describe('specShort', () => {
  it('сокращает длинные должности', () => {
    expect(specShort('Инженер связи', null)).toBe('Инж. связи')
    expect(specShort(null, 'КИПиА')).toBe('КИПиА')
  })
  it('даёт запасную подпись', () => {
    expect(specShort(null, null)).toBe('Профессия')
  })
})

describe('прочее', () => {
  it('truncate добавляет многоточие', () => {
    expect(truncate('абвгде', 3)).toBe('абв…')
    expect(truncate('абв', 10)).toBe('абв')
  })
  it('isValidEmail отсеивает мусор', () => {
    expect(isValidEmail('a@kazatomprom.kz')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('без собаки')).toBe(false)
  })
})
