"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Question = {
  id: string
  question: string
  type: "text" | "select" | "date"
  placeholder?: string
  options?: { value: string; label: string }[]
  icon?: React.ReactNode
}

const questions: Question[] = [
  {
    id: "from",
    question: "De onde você vai mudar?",
    type: "text",
    placeholder: "Ex: São Paulo, SP",
    icon: "📍",
  },
  {
    id: "to",
    question: "Para onde você vai mudar?",
    type: "text",
    placeholder: "Ex: Rio de Janeiro, RJ",
    icon: "🏠",
  },
  {
    id: "property",
    question: "Que tipo de imóvel você está mudando?",
    type: "select",
    placeholder: "Selecione o tipo",
    options: [
      { value: "apartamento-1", label: "Apartamento 1 quarto" },
      { value: "apartamento-2", label: "Apartamento 2 quartos" },
      { value: "apartamento-3", label: "Apartamento 3+ quartos" },
      { value: "casa", label: "Casa" },
      { value: "comercial", label: "Comercial" },
    ],
    icon: "🏢",
  },
  {
    id: "date",
    question: "Quando você pretende fazer a mudança?",
    type: "date",
    icon: "📅",
  },
  {
    id: "name",
    question: "Qual é o seu nome?",
    type: "text",
    placeholder: "Digite seu nome",
    icon: "👤",
  },
  {
    id: "email",
    question: "E qual é o seu melhor e-mail?",
    type: "text",
    placeholder: "seuemail@exemplo.com",
    icon: "✉️",
  },
]

export function ConversationalForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isCompleted, setIsCompleted] = useState(false)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleNext = () => {
    if (currentAnswer.trim()) {
      setAnswers({ ...answers, [currentQuestion.id]: currentAnswer })

      if (currentStep === questions.length - 1) {
        setIsCompleted(true)
      } else {
        setCurrentStep(currentStep + 1)
        setCurrentAnswer("")
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setCurrentAnswer(answers[questions[currentStep - 1].id] || "")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentAnswer.trim()) {
      handleNext()
    }
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">Tudo certo!</h2>
            <p className="text-xl text-muted-foreground">
              Recebemos suas informações. Em breve você receberá orçamentos das melhores empresas de mudança.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg space-y-4">
            <h3 className="font-semibold text-lg text-foreground mb-4">Resumo da sua solicitação:</h3>
            {questions.map((q) => (
              <div key={q.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <span className="text-2xl">{q.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{q.question}</p>
                  <p className="font-medium text-foreground">{answers[q.id]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Pergunta {currentStep + 1} de {questions.length}
            </span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-6 mb-8">
          {/* Previous Questions & Answers */}
          {questions.slice(0, currentStep).map((q, index) => (
            <div key={q.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Question Bubble */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  GM
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-md max-w-md">
                  <p className="text-foreground font-medium">{q.question}</p>
                </div>
              </div>

              {/* Answer Bubble */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-6 py-4 shadow-md max-w-md">
                  <p className="font-medium">{answers[q.id]}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-full flex items-center justify-center text-2xl">
                  {q.icon}
                </div>
              </div>
            </div>
          ))}

          {/* Current Question */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                GM
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-md max-w-md">
                <p className="text-foreground font-medium text-lg">{currentQuestion.question}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Input */}
        <div className="bg-white rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-4">
            <Label className="text-sm text-muted-foreground">Sua resposta</Label>

            {currentQuestion.type === "select" ? (
              <Select value={currentAnswer} onValueChange={setCurrentAnswer}>
                <SelectTrigger className="h-14 rounded-xl text-base">
                  <SelectValue placeholder={currentQuestion.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options?.map((option) => (
                    <SelectItem key={option.value} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={currentQuestion.type === "date" ? "date" : "text"}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentQuestion.placeholder}
                className="h-14 rounded-xl text-base"
                autoFocus
              />
            )}

            <div className="flex gap-3 pt-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="rounded-xl bg-transparent"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
              )}

              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className={cn("rounded-xl font-semibold transition-all", currentStep === 0 ? "w-full" : "flex-1")}
              >
                {currentStep === questions.length - 1 ? "Finalizar" : "Continuar"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Pressione <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">Enter ↵</kbd> para continuar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

