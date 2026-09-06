// Описание типов публикаций вынесено из компонента: его используют
// и карточка в ленте, и окно ответов.
import { IconCase, IconPost, IconQuestion } from '../components/Icons'

export const POST_TYPES = {
  post: { label: 'Пост', cls: 'type-post', Icon: IconPost },
  case: { label: 'Кейс', cls: 'type-case', Icon: IconCase },
  question: { label: 'Вопрос', cls: 'type-question', Icon: IconQuestion },
}

export const postType = (type) => POST_TYPES[type] || POST_TYPES.post
