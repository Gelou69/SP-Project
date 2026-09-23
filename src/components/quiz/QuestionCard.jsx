import { motion } from 'framer-motion'
import { Badge } from '../ui'
import AnswerOption from './AnswerOption'
import QuizImage from '../diagrams/Diagrams'

export default function QuestionCard({
  question,
  index,
  total,
  selectedLabel,
  answerResult,
  onSelect,
  locked,
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="w-full"
      role="group"
      aria-label={`Question ${index + 1} of ${total}`}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <Badge tone="sky">{question.topic}</Badge>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Question {index + 1} / {total}
        </span>
      </div>

      {question.image_url && (
        <div className="mb-4 mt-2 overflow-hidden rounded-2xl" style={{ minHeight: 140 }}>
          <QuizImage imageUrl={question.image_url} alt={question.question_text} className="h-44 w-full sm:h-52" />
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
        {question.question_text}
      </h2>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answer choices">
        {question.choices.map((choice) => {
          // Never reveal the correct answer on a wrong response. Only the
          // picked option gets feedback (result comes from the server).
          let state = 'idle'
          if (selectedLabel) {
            if (answerResult === 'correct' && choice.label === selectedLabel) {
              state = 'correct'
            } else if (answerResult === 'wrong' && choice.label === selectedLabel) {
              state = 'wrong'
            }
          }
          return (
            <AnswerOption
              key={choice.label}
              label={choice.label}
              text={choice.text}
              state={state}
              disabled={locked}
              onSelect={() => onSelect(choice.label)}
            />
          )
        })}
      </div>
    </motion.div>
  )
}