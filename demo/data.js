// Демонстрационные данные: реальные роли и оборудование уранодобычи,
// чтобы интерфейс было видно в рабочем состоянии, а не на «Lorem ipsum».

export const ME = 'u-me'

export const profiles = [
  {
    id: ME, full_name: 'Ахметов Ерлан Серикович', position: 'Слесарь КИПиА 6 разряда',
    specialty: 'Слесарь КИПиА 6 разряда', dzo: 'АО «Орталык»', region: 'Рудник Мынкудук',
    experience_years: 9, bio: 'Наладка АСУ ТП участков закисления и сорбции. Помогу с Profibus, диагностикой датчиков давления и настройкой контуров регулирования.',
    skills: ['TIA Portal', 'Profibus DP', 'SCADA', 'Модбас', 'Метрология'],
    equipment: ['Siemens S7-300', 'Yokogawa EJA110E', 'Burkert 8694', 'Endress+Hauser Promag'],
    telegram: 'erlan_kip', is_expert: false,
  },
  {
    id: 'u-2', full_name: 'Бекова Айгуль Маратовна', position: 'Технолог ГМЗ',
    specialty: 'Технолог ГМЗ', dzo: 'АО «СП «Инкай»', region: 'Переработка',
    experience_years: 14, bio: 'Гидрометаллургический передел: выщелачивание, сорбция, десорбция. Веду обучение молодых технологов.',
    skills: ['Сорбция', 'Десорбция', 'Выщелачивание', 'Экстракция', 'Баланс по урану'],
    equipment: ['Ионообменные колонны', 'Смесители-отстойники'],
    telegram: 'aigul_gmz', is_expert: true,
  },
  {
    id: 'u-3', full_name: 'Сериков Данияр Аскарович', position: 'Буровой мастер',
    specialty: 'Буровой мастер', dzo: 'ТОО «СП «Катко»', region: 'Участок Торткудук',
    experience_years: 11, bio: 'Сооружение и ремонт технологических скважин. ПРС, обсадка, гравийная обсыпка.',
    skills: ['ПРС', 'Обсадка', 'Гравийная обсыпка', 'Геофизика скважин'],
    equipment: ['УРБ-2А2', 'ZJ-30'], telegram: null, is_expert: true,
  },
  {
    id: 'u-4', full_name: 'Нурланова Асем', position: 'Инженер по охране труда',
    specialty: 'Инженер по охране труда', dzo: 'АО «Байкен-U»', region: 'Промплощадка',
    experience_years: 6, bio: '', skills: ['Радиационный контроль', 'Наряд-допуск', 'Расследование'],
    equipment: ['ДКС-96', 'РКС-01'], telegram: null, is_expert: false,
  },
  {
    id: 'u-5', full_name: 'Оспанов Тимур', position: 'Электромонтёр по ремонту',
    specialty: 'Электромонтёр по ремонту', dzo: 'АО «Орталык»', region: 'Рудник Мынкудук',
    experience_years: 4, bio: '', skills: ['РУ-6кВ', 'Частотные приводы', 'Релейная защита'],
    equipment: ['Danfoss VLT', 'Schneider Altivar'], telegram: null, is_expert: false,
  },
  {
    id: 'u-6', full_name: 'Жаксыбек Мадина', position: 'Геолог участка',
    specialty: 'Геолог участка', dzo: 'ТОО «Аппак»', region: 'Участок 4',
    experience_years: 8, bio: '', skills: ['Опробование', 'Каротаж', 'Micromine'],
    equipment: [], telegram: null, is_expert: false,
  },
]

const ago = (m) => new Date(Date.now() - m * 60000).toISOString()

export const posts = [
  {
    id: 'p-1', author_id: 'u-2', type: 'case',
    title: 'Извлечение на сорбции упало с 96 до 88 % за две недели',
    body: 'Проверили pH и Eh продуктивного раствора — в норме. Расход смолы по регламенту, колонны без каналообразования.\n\nОказалось, новая партия смолы пришла с завышенной влажностью: фактическая загрузка по сухому весу была на 12 % ниже паспортной. Пересчитали загрузку, добавили входной контроль влажности при приёмке.\n\nИзвлечение вернулось на 95,4 % за четыре дня. Теперь влажность смолы проверяем на каждой партии — заняло 20 минут, сэкономило две недели.',
    tags: ['сорбция', 'смола', 'гмз'], is_solved: false, likes_count: 34, created_at: ago(52),
  },
  {
    id: 'p-2', author_id: ME, type: 'question',
    title: 'Дрейф нуля на Yokogawa EJA110E, кто сталкивался?',
    body: 'Датчик перепада на узле закисления. За смену уходит на 0,8 кПа в минус. Калибровка держится сутки, потом снова. Импульсные линии продували, конденсата нет. Температура в шкафу стабильная.',
    tags: ['кипиа', 'yokogawa', 'датчики'], is_solved: true, likes_count: 8, created_at: ago(190),
  },
  {
    id: 'p-3', author_id: 'u-3', type: 'post',
    title: 'Закончили обвязку блока 14 на три недели раньше графика',
    body: 'Отдельное спасибо смене Кабылова — работали при минус двадцать восемь. 42 скважины, ни одного отклонения по приёмке.',
    tags: ['бурение', 'катко'], is_solved: false, likes_count: 61, created_at: ago(600),
  },
  {
    id: 'p-4', author_id: 'u-5', type: 'question',
    title: 'Частотник Danfoss VLT выдаёт ошибку 14 при пуске насоса',
    body: 'Насос ГрАТ 450/67, пуск под нагрузкой. Ошибка «замыкание на землю», но мегомметр показывает 12 МОм на обмотках. Кабель тоже звонится нормально.',
    tags: ['электрика', 'danfoss', 'насосы'], is_solved: false, likes_count: 3, created_at: ago(1500),
  },
  {
    id: 'p-5', author_id: 'u-4', type: 'case',
    title: 'Как сократили время оформления наряда-допуска с 40 до 12 минут',
    body: 'Раньше исполнитель шёл за подписями в три кабинета. Свели согласование в один журнал на участке, ответственный проверяет и подписывает на месте.\n\nЗа квартал ни одного просроченного наряда, замечаний по надзору нет.',
    tags: ['охрана труда', 'наряд-допуск'], is_solved: false, likes_count: 27, created_at: ago(2600),
  },
  {
    id: 'p-6', author_id: 'u-6', type: 'post',
    title: 'Обновили модель залежи по блоку 7 в Micromine',
    body: 'Добавили 38 новых скважин опробования. Контур сместился на 40 метров к северо-востоку.',
    tags: ['геология', 'micromine'], is_solved: false, likes_count: 14, created_at: ago(4300),
  },
]

export const comments = [
  { id: 'c-1', post_id: 'p-2', author_id: 'u-5', body: 'Проверьте разделительные мембраны. У нас на таком же датчике была микротечь заполняющей жидкости — уходило примерно так же, по 0,7–0,9 кПа за смену.', is_solution: true, created_at: ago(170) },
  { id: 'c-2', post_id: 'p-2', author_id: 'u-2', body: 'Ещё вариант: проверьте статическое давление. EJA110E чувствителен к перекосу по статике, если один вентиль подтравливает.', is_solution: false, created_at: ago(150) },
  { id: 'c-3', post_id: 'p-2', author_id: 'u-3', body: 'У нас помогла замена уравнительного вентильного блока. Год отходил без дрейфа.', is_solution: false, created_at: ago(120) },
  { id: 'c-4', post_id: 'p-1', author_id: ME, body: 'Айгуль Маратовна, а входной контроль влажности чем делаете? Термовесами или по методике сушки?', is_solution: false, created_at: ago(40) },
  { id: 'c-5', post_id: 'p-1', author_id: 'u-6', body: 'Хороший кейс. У нас похожая история была с активированным углём — тоже влажность.', is_solution: false, created_at: ago(30) },
  { id: 'c-6', post_id: 'p-1', author_id: 'u-3', body: 'Полезно. У нас входной контроль тоже был формальный, пока не поймали похожее.', is_solution: false, created_at: ago(25) },
  { id: 'c-7', post_id: 'p-2', author_id: 'u-6', body: 'А импульсные линии по уклону смонтированы? Если провис есть, конденсат копится именно там.', is_solution: false, created_at: ago(100) },
  { id: 'c-8', post_id: 'p-2', author_id: 'u-4', body: 'Уточните, датчик в обогреваемом шкафу? Зимой у нас похожее лечилось подогревом.', is_solution: false, created_at: ago(90) },
  { id: 'c-9', post_id: 'p-3', author_id: ME, body: 'Поздравляю! Сколько человек в смене было?', is_solution: false, created_at: ago(560) },
  { id: 'c-10', post_id: 'p-3', author_id: 'u-2', body: 'Отличный результат.', is_solution: false, created_at: ago(520) },
  { id: 'c-11', post_id: 'p-4', author_id: ME, body: 'Проверьте экран кабеля со стороны частотника — часто заземляют с двух концов и ловят наводку. Ошибка 14 у Danfoss срабатывает и на неё.', is_solution: false, created_at: ago(1400) },
  { id: 'c-12', post_id: 'p-5', author_id: 'u-5', body: 'Забрали к себе на участок, спасибо.', is_solution: false, created_at: ago(2400) },
  { id: 'c-13', post_id: 'p-5', author_id: 'u-3', body: 'А журнал бумажный или в 1С?', is_solution: false, created_at: ago(2300) },
  { id: 'c-14', post_id: 'p-6', author_id: 'u-2', body: 'Контур сильно поехал. Пересчитывали запасы?', is_solution: false, created_at: ago(4000) },
]

export const likes = new Set(['p-1', 'p-5'])

export const communities = [
  { id: 'g-1', name: 'КИПиА Казатомпром', description: 'Слесари и инженеры КИПиА всей группы КАП. Кейсы, вопросы, обмен опытом.', icon: 'gauge', kind: 'specialty', is_closed: false, creator_id: null, members_count: 148 },
  { id: 'g-2', name: 'Буровики КАП', description: 'Буровые мастера, операторы и инженеры ПРС всех дочерних предприятий.', icon: 'drill', kind: 'specialty', is_closed: false, creator_id: null, members_count: 96 },
  { id: 'g-3', name: 'Химики КАП', description: 'Технологи гидрометаллургического передела. Выщелачивание, сорбция, экстракция.', icon: 'flask', kind: 'specialty', is_closed: false, creator_id: null, members_count: 74 },
  { id: 'g-4', name: 'Энергетики КАП', description: 'Электрики и энергетики предприятий группы.', icon: 'bolt', kind: 'specialty', is_closed: false, creator_id: null, members_count: 63 },
  { id: 'g-5', name: 'Охрана труда', description: 'Промышленная безопасность, охрана труда и радиационный контроль.', icon: 'shield', kind: 'specialty', is_closed: true, creator_id: null, members_count: 51 },
  { id: 'g-6', name: 'Геологи КАП', description: 'Геологи и гидрогеологи. Разведка, опробование, моделирование залежей.', icon: 'layers', kind: 'specialty', is_closed: false, creator_id: null, members_count: 44 },
  { id: 'g-7', name: 'Орталык', description: 'Сообщество сотрудников АО «Орталык».', icon: 'mountain', kind: 'dzo', is_closed: false, creator_id: null, members_count: 112 },
  { id: 'g-8', name: 'Инкай', description: 'Сообщество сотрудников АО «СП «Инкай».', icon: 'factory', kind: 'dzo', is_closed: false, creator_id: null, members_count: 87 },
  { id: 'g-9', name: 'Молодые специалисты', description: 'Для тех кто в КАПе до 5 лет. Вопросы, менторство, знакомства.', icon: 'helmet', kind: 'interest', is_closed: false, creator_id: null, members_count: 39 },
]

export const myCommunities = new Set(['g-1', 'g-7'])

export const conversations = [
  { id: 'k-1', user1_id: ME, user2_id: 'u-2', last_message: 'Термовесами, MB-45. Могу скинуть методику.', last_msg_at: ago(18) },
  { id: 'k-2', user1_id: ME, user2_id: 'u-3', last_message: 'Понял, спасибо! Заеду на неделе.', last_msg_at: ago(320) },
]

export const messages = [
  { id: 'm-1', conversation_id: 'k-1', sender_id: ME, body: 'Айгуль Маратовна, добрый день! По вашему кейсу с сорбцией — чем меряете влажность смолы?', read: true, created_at: ago(28) },
  { id: 'm-2', conversation_id: 'k-1', sender_id: 'u-2', body: 'Добрый день, Ерлан!', read: false, created_at: ago(20) },
  { id: 'm-3', conversation_id: 'k-1', sender_id: 'u-2', body: 'Термовесами, MB-45. Могу скинуть методику.', read: false, created_at: ago(18) },
  { id: 'm-4', conversation_id: 'k-2', sender_id: 'u-3', body: 'Ерлан, привет. Нужна помощь с настройкой расходомера на приёмке.', read: true, created_at: ago(400) },
  { id: 'm-5', conversation_id: 'k-2', sender_id: ME, body: 'Привет! Какая модель?', read: true, created_at: ago(380) },
  { id: 'm-6', conversation_id: 'k-2', sender_id: 'u-3', body: 'Promag 50W, DN100.', read: true, created_at: ago(340) },
  { id: 'm-7', conversation_id: 'k-2', sender_id: ME, body: 'Понял, спасибо! Заеду на неделе.', read: true, created_at: ago(320) },
]

export const notifications = [
  { id: 'n-1', user_id: ME, actor_id: 'u-5', type: 'solution', post_id: 'p-2', read: false, created_at: ago(165) },
  { id: 'n-2', user_id: ME, actor_id: 'u-2', type: 'comment', post_id: 'p-2', read: false, created_at: ago(150) },
  { id: 'n-3', user_id: ME, actor_id: 'u-3', type: 'comment', post_id: 'p-2', read: false, created_at: ago(120) },
  { id: 'n-4', user_id: ME, actor_id: 'u-6', type: 'like', post_id: 'p-2', read: true, created_at: ago(200) },
  { id: 'n-5', user_id: ME, actor_id: 'u-4', type: 'like', post_id: 'p-2', read: true, created_at: ago(240) },
]

export const dzoList = [
  'Головной офис (АО «НАК «Казатомпром»)', 'АО «Орталык»', 'АО «СП «Инкай»',
  'АО «Байкен-U»', 'ТОО «СП «Катко»', 'ТОО «Аппак»', 'ТОО «СП «Хорасан-U»',
  'ТОО «Кызылкум»', 'ТОО «Семизбай-U»', 'ТОО «Каратау»', 'АО «Волковгеология»',
  'АО «УМЗ»', 'Другое',
]
