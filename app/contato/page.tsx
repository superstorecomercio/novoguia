'use client';

import { useState, type FormEvent } from 'react';
import Button from '../components/Button';

const ContatoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Por enquanto, apenas console.log
    console.log('Dados do contato:', formData);

    // Simula delay de envio
    setTimeout(() => {
      alert('Mensagem enviada com sucesso! (Apenas simulação - dados no console)');
      setIsSubmitting(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Entre em Contato</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-700 mb-6">
          Tem alguma dúvida, sugestão ou precisa de ajuda? Entre em contato
          conosco através do formulário abaixo ou pelos nossos canais de
          atendimento.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Assunto *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mensagem *
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Outras Formas de Contato
        </h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>E-mail:</strong> contato@guiademudancas.com.br
          </p>
          <p>
            <strong>Horário de Atendimento:</strong> Segunda a Sexta, das 9h às
            18h
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContatoPage;

