'use client'

import { Shield, Lock, Eye, Server, FileCheck, CheckCircle, XCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SecurityPage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-10 w-10 text-primary-600" />
          <h1 className="text-4xl font-bold">{t('security.title')}</h1>
        </div>
        <p className="text-lg text-slate-600">
          {t('security.subtitle')}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {t('security.lastUpdated')}
        </p>
      </div>

      {/* Our Commitment */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lock className="h-6 w-6 text-primary-600" />
          {t('security.commitment.title')}
        </h2>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-slate-700">
            {t('security.commitment.description')}
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          {t('security.features.title')}
        </h2>

        <div className="space-y-6">
          {/* Data Protection */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary-600" />
              {t('security.dataProtection.title')}
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.dataProtection.https').split(':')[0]}:</strong> {t('security.dataProtection.https').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.dataProtection.noPersonal').split(':')[0]}:</strong> {t('security.dataProtection.noPersonal').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.dataProtection.storage').split(':')[0]}:</strong> {t('security.dataProtection.storage').split(':').slice(1).join(':')}</span>
              </li>
            </ul>
          </div>

          {/* Rate Limiting */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary-600" />
              {t('security.rateLimiting.title')}
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.rateLimiting.chatbot').split(':')[0]}:</strong> {t('security.rateLimiting.chatbot').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.rateLimiting.admin').split(':')[0]}:</strong> {t('security.rateLimiting.admin').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.rateLimiting.upload').split(':')[0]}:</strong> {t('security.rateLimiting.upload').split(':').slice(1).join(':')}</span>
              </li>
            </ul>
          </div>

          {/* Input Validation */}
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary-600" />
              {t('security.inputValidation.title')}
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.inputValidation.xss').split(':')[0]}:</strong> {t('security.inputValidation.xss').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.inputValidation.fileType').split(':')[0]}:</strong> {t('security.inputValidation.fileType').split(':').slice(1).join(':')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{t('security.inputValidation.messageLength').split(':')[0]}:</strong> {t('security.inputValidation.messageLength').split(':').slice(1).join(':')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Data We Collect */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary-600" />
          {t('security.dataCollection.title')}
        </h2>

        <div className="border rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">{t('security.dataCollection.chatbot.title')}</h3>
          <div className="space-y-2 text-slate-700">
            <p>{t('security.dataCollection.chatbot.what')}</p>
            <p>{t('security.dataCollection.chatbot.why')}</p>
            <p>{t('security.dataCollection.chatbot.howLong')}</p>
            <p>{t('security.dataCollection.chatbot.whoAccess')}</p>
            <p>{t('security.dataCollection.chatbot.rights')}</p>
          </div>
        </div>

        <div className="bg-slate-50 border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">{t('security.dataCollection.noPersonal.title')}</h3>
          <p className="mb-3 text-slate-700">{t('security.dataCollection.noPersonal.description')}</p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('security.dataCollection.noPersonal.names')}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('security.dataCollection.noPersonal.email')}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('security.dataCollection.noPersonal.phone')}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('security.dataCollection.noPersonal.ip')}</span>
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{t('security.dataCollection.noPersonal.location')}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Third-Party Services */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('security.thirdParty.title')}</h2>
        <p className="text-slate-700 mb-4">{t('security.thirdParty.description')}</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border p-3 text-left">{t('security.thirdParty.service')}</th>
                <th className="border p-3 text-left">{t('security.thirdParty.purpose')}</th>
                <th className="border p-3 text-left">{t('security.thirdParty.dataShared')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3"><strong>OpenAI</strong></td>
                <td className="border p-3">{t('security.thirdParty.openai')}</td>
                <td className="border p-3">{t('security.thirdParty.openai.data')}</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Vercel</strong></td>
                <td className="border p-3">{t('security.thirdParty.vercel')}</td>
                <td className="border p-3">{t('security.thirdParty.vercel.data')}</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Upstash Redis</strong></td>
                <td className="border p-3">{t('security.thirdParty.upstash')}</td>
                <td className="border p-3">{t('security.thirdParty.upstash.data')}</td>
              </tr>
              <tr>
                <td className="border p-3"><strong>Pinecone</strong></td>
                <td className="border p-3">{t('security.thirdParty.pinecone')}</td>
                <td className="border p-3">{t('security.thirdParty.pinecone.data')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* GDPR Compliance */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('security.gdpr.title')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">{t('security.gdpr.access.title')}</h3>
            </div>
            <p className="text-sm text-slate-700">{t('security.gdpr.access.description')}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">{t('security.gdpr.deletion.title')}</h3>
            </div>
            <p className="text-sm text-slate-700">{t('security.gdpr.deletion.description')}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">{t('security.gdpr.object.title')}</h3>
            </div>
            <p className="text-sm text-slate-700">{t('security.gdpr.object.description')}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">{t('security.gdpr.minimization.title')}</h3>
            </div>
            <p className="text-sm text-slate-700">{t('security.gdpr.minimization.description')}</p>
          </div>
        </div>
      </section>

      {/* Security Incident Response */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('security.incident.title')}</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <p className="text-slate-700 mb-4">
            {t('security.incident.description')}
          </p>
          <p className="text-slate-700">
            <strong>{t('security.incident.email')}</strong> <a href="mailto:hungreo2005@gmail.com" className="text-primary-600 hover:underline">hungreo2005@gmail.com</a>
          </p>
          <p className="text-slate-700 mt-4">{t('security.incident.willDo')}</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 mt-2">
            <li>{t('security.incident.acknowledge')}</li>
            <li>{t('security.incident.investigate')}</li>
            <li>{t('security.incident.patch')}</li>
            <li>{t('security.incident.notify')}</li>
          </ol>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('security.compliance.title')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>{t('security.compliance.https').split(' - ')[0]}</strong> - {t('security.compliance.https').split(' - ')[1]}</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>{t('security.compliance.owasp').split(' - ')[0]}</strong> - {t('security.compliance.owasp').split(' - ')[1]}</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>{t('security.compliance.gdpr').split(' - ')[0]}</strong> - {t('security.compliance.gdpr').split(' - ')[1]}</span>
          </div>
          <div className="flex items-center gap-3 border rounded-lg p-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-slate-700"><strong>{t('security.compliance.audits').split(' - ')[0]}</strong> - {t('security.compliance.audits').split(' - ')[1]}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t pt-8 text-center text-sm text-slate-600">
        <p>{t('security.footer.contact')} <a href="mailto:hungreo2005@gmail.com" className="text-primary-600 hover:underline">hungreo2005@gmail.com</a></p>
        <p className="mt-2">{t('security.footer.audit')}</p>
        <p className="mt-4 text-xs">{t('security.footer.updated')}</p>
      </div>
    </div>
  )
}
