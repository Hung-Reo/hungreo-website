/**
 * Language Context for Bilingual Support (EN/VI)
 * Client-side language switching with localStorage persistence
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations = {
  en: {
    // Header Navigation
    'header.home': 'Home',
    'header.about': 'About',
    'header.projects': 'Projects',
    'header.blog': 'Blog',
    'header.aiTools': 'AI Tools',
    'header.contact': 'Contact',
    'header.admin': 'Admin',
    'header.language': 'Language',
    'header.switchTo': 'Tiếng Việt',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. All rights reserved.',
    'footer.security': 'Secured with HTTPS | GDPR Compliant | No Tracking',
    'footer.learnMore': 'Learn More',
    'footer.email': 'Email',
    'footer.linkedin': 'LinkedIn',
    'footer.github': 'GitHub',
    'footer.securityPage': 'Security',

    // Knowledge/Videos Page
    'knowledge.title': 'AI Tools - Video Library',
    'knowledge.subtitle': 'Explore curated videos organized by category',
    'knowledge.categories.leadership': 'Leadership',
    'knowledge.categories.aiWorks': 'AI Works',
    'knowledge.categories.health': 'Health',
    'knowledge.categories.entertaining': 'Entertaining',
    'knowledge.categories.philosophy': 'Human Philosophy',
    'knowledge.videoCount': '{count} video(s)',
    'knowledge.browseVideos': 'Browse videos',
    'knowledge.noVideos': 'No videos available',
    'knowledge.noVideosSearch': 'No videos found matching your search',
    'knowledge.howItWorks.title': 'How it works',
    'knowledge.howItWorks.browse': 'Browse videos by category: Leadership, AI Works, Health, Entertaining, or Human Philosophy',
    'knowledge.howItWorks.transcript': 'Each video page includes the full transcript and an AI chatbot',
    'knowledge.howItWorks.ask': 'Ask questions about the video content and get instant, context-aware answers',

    // Common
    'common.readMore': 'Read more',
    'common.loading': 'Loading...',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',

    // Video-related
    'video.transcript': 'Transcript',
    'video.summary': 'Summary',
    'video.duration': 'Duration',
    'video.publishedAt': 'Published on',
    'video.category': 'Category',
    'video.relatedVideos': 'Related Videos',

    // ChatBot
    'chatbot.title': 'AI Assistant',
    'chatbot.placeholder': 'Ask me anything...',
    'chatbot.send': 'Send',
    'chatbot.thinking': 'Thinking...',
    'chatbot.error': 'Sorry, I encountered an error. Please try again.',

    // Home Page
    'home.hero.name': 'Hung Dinh',
    'home.hero.tagline': 'Business Analyst → AI Product Builder',
    'home.hero.description': '20 years Business Analyst experience in Education, FMCG & Manufacturing. Now building AI-powered products combining analytical rigor with technical execution.',
    'home.hero.viewProjects': 'View Projects',
    'home.hero.aboutMe': 'About Me',
    'home.hero.downloadCV': 'Download CV',
    'home.hero.loadingCV': 'Loading...',
    'home.values.title1': 'Problem-First Mindset',
    'home.values.desc1': 'Understanding the problem deeply before jumping to solutions',
    'home.values.title2': 'Human + AI',
    'home.values.desc2': 'AI is a thought partner, not just a tool - we collaborate to solve real problems, not chase technology',
    'home.values.title3': 'Build in Public',
    'home.values.desc3': 'Sharing failures and learnings to help others grow',
    'home.featured.projects': 'Featured Projects',
    'home.featured.projectsPlaceholder': 'Projects coming soon... Building in progress! 🚀',
    'home.featured.latestPosts': 'Latest Posts',
    'home.featured.postsPlaceholder': 'Blog posts coming soon... Stay tuned! ✍️',

    // Origin Story Section
    'home.origin.title': 'Where It All Began',
    'home.origin.act1': 'After one month deep-diving into AI, I realized something profound: AI wasn\'t just another system. Not like SAP, not like any tool I\'d worked with before. This was "Trí Tuệ Máy" - Machine Intelligence - something that exceeded my imagination of what technology could do.',
    'home.origin.act2.intro': 'As AI\'s capabilities became clearer, a question emerged:',
    'home.origin.act2.question': 'What makes us MORE HUMAN in the age of AI?',
    'home.origin.act3.intro': 'My answer came through the "Văn Hóa Gia Đình" (Family Values) project - a framework of family values not just for families, but for any organization, team, or community.',
    'home.origin.act3.closing': 'This isn\'t about building AI to replace humans, but using AI to help us remember what makes us human.',

    // About Page
    'about.title': 'About Me',
    'about.subtitle': '20 years of IT leadership experience, now embracing Product Management with AI',
    'about.photo': 'Photo',
    'about.name': 'Dinh Quang Hung',
    'about.role': 'IT Leader | AI Consultant | Product Management Enthusiast',
    'about.intro': "Available for new opportunities to add value, challenge my leadership, and continue my learning journey. With 8 years as Head of IT and 20 years in multinational companies (FMCG, Manufacturing, K12 Education), I'm now focusing on AI-powered products and Product Management.",
    'about.journey.title': 'Professional Journey',
    'about.education.title': 'Education & Expertise',
    'about.education.subtitle': 'Education',
    'about.education.mba': 'MBA - Business in IT, University of Technology Sydney (UTS), Australia (2001-2003)',
    'about.education.bachelor': 'Bachelor of Commerce - Economics & Finance, Macquarie University, Australia (1997-2001)',
    'about.education.diploma': 'Diploma of Commerce - Business Economics, Insearch Institute, Australia (1996-1997)',
    'about.currentFocus.title': 'Current Focus',
    'about.currentFocus.ai': 'AI learner and practitioner (AI chatbots, AI apps, AI Agents with n8n)',
    'about.currentFocus.pm': 'Product Management transition',
    'about.currentFocus.team': 'Team management & leadership',
    'about.currentFocus.sap': 'SAP ERP systems',
    'about.currentFocus.itsm': 'IT Service Management',
    'about.training.title': 'Training & Development',
    'about.competencies.title': 'Core Competencies',
    'about.competency.integrity': 'Integrity',
    'about.competency.respect': 'Respect Others',
    'about.competency.accountability': 'Accountability',
    'about.competency.learning': 'Learning Attitude',
    'about.competency.english': 'Excellent English Communication',
    'about.competency.leadership': 'Team Leadership',
    'about.beyond.title': 'Beyond Work',
    'about.beyond.bio': 'Born March 9, 1975. Married, Vietnamese national living in District 3, HCMC.',
    'about.beyond.interests': "When I'm not working on IT solutions or learning about AI, you'll find me running or traveling. I believe in continuous learning and challenging myself with new opportunities. My 20 years of experience across diverse industries has taught me that the best solutions come from understanding people first, then applying technology.",

    // Projects Page
    'projects.title': 'Projects',
    'projects.subtitle': 'AI-powered solutions built to solve real problems',
    'projects.empty': 'Projects coming soon... Building in progress! 🚀',
    'projects.emptySubtitle': 'Check back later for AI-powered project showcases',
    'projects.backToProjects': '← Back to Projects',
    'projects.viewGithub': 'View on GitHub',
    'projects.liveDemo': 'Live Demo',
    'projects.keyLearnings': 'Key Learnings',
    'projects.relatedProjects': 'Related Projects',
    'projects.screenshots': 'Screenshots',
    'projects.viewCode': 'View Code',

    // Blog Page
    'blog.title': 'Blog',
    'blog.subtitle': 'Thoughts on product management, AI, and lessons learned along the way',
    'blog.empty': 'Blog posts coming soon... Stay tuned! ✍️',
    'blog.emptySubtitle': 'First posts will cover BA to PM transition and AI learnings',
    'blog.backToBlog': '← Back to Blog',
    'blog.minRead': 'min read',
    'blog.thanks': 'Thanks for reading! If you found this helpful, feel free to share it or reach out on',
    'blog.linkedin': 'LinkedIn',

    // Contact Page
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Have a question or want to work together? Feel free to reach out!',
    'contact.email.label': 'Email',
    'contact.linkedin.label': 'LinkedIn',
    'contact.linkedin.description': 'Connect with me',
    'contact.github.label': 'GitHub',
    'contact.github.description': 'View my code',

    // Security Page
    'security.title': 'Security & Privacy',
    'security.subtitle': 'At Hungreo, we take the security and privacy of your data seriously. This page outlines the measures we\'ve implemented to protect your information.',
    'security.lastUpdated': 'Last Updated: November 2025',
    'security.commitment.title': 'Our Commitment to Security',
    'security.commitment.description': 'We implement industry-standard security practices to ensure your data is protected at all times. Our website is secured with HTTPS encryption, rate limiting, and comprehensive input validation.',
    'security.features.title': 'Security Features',
    'security.dataProtection.title': '1. Data Protection',
    'security.dataProtection.https': 'Encrypted Connections: All data transmitted between your browser and our servers is encrypted using HTTPS/TLS.',
    'security.dataProtection.noPersonal': 'No Personal Data Collection: Our chatbot does not collect or store personal information (names, emails, phone numbers).',
    'security.dataProtection.storage': 'Secure Storage: Chat logs are stored in encrypted databases with automatic 90-day expiration.',
    'security.rateLimiting.title': '2. Rate Limiting & Abuse Prevention',
    'security.rateLimiting.chatbot': 'Chatbot Rate Limiting: Limited to 10 messages per minute to prevent spam and abuse.',
    'security.rateLimiting.admin': 'Admin Protection: Login attempts limited to 5 per 15 minutes with automatic lockout.',
    'security.rateLimiting.upload': 'File Upload Limits: Maximum 5 uploads per 10 minutes to prevent storage abuse.',
    'security.inputValidation.title': '3. Input Validation',
    'security.inputValidation.xss': 'XSS Prevention: All user input is sanitized to prevent cross-site scripting attacks.',
    'security.inputValidation.fileType': 'File Type Validation: Only safe file types (PDF, DOCX, TXT) are allowed for uploads.',
    'security.inputValidation.messageLength': 'Message Length Limits: Chat messages limited to 1-1000 characters.',
    'security.dataCollection.title': 'What Data We Collect',
    'security.dataCollection.chatbot.title': 'Chatbot Conversations',
    'security.dataCollection.chatbot.what': 'What we collect: Your questions, AI responses, timestamp, page context',
    'security.dataCollection.chatbot.why': 'Why we collect it: To improve chatbot accuracy and user experience',
    'security.dataCollection.chatbot.howLong': 'How long we keep it: 90 days (automatic deletion)',
    'security.dataCollection.chatbot.whoAccess': 'Who can access it: Admin only (not sold or shared with third parties)',
    'security.dataCollection.chatbot.rights': 'Your rights: You can request deletion of your data at any time',
    'security.dataCollection.noPersonal.title': 'No Personal Identification',
    'security.dataCollection.noPersonal.description': 'We do not collect:',
    'security.dataCollection.noPersonal.names': 'Names',
    'security.dataCollection.noPersonal.email': 'Email addresses (except for admin login)',
    'security.dataCollection.noPersonal.phone': 'Phone numbers',
    'security.dataCollection.noPersonal.ip': 'IP addresses (used only for rate limiting, not stored long-term)',
    'security.dataCollection.noPersonal.location': 'Location data',
    'security.thirdParty.title': 'Third-Party Services',
    'security.thirdParty.description': 'We use the following trusted third-party services:',
    'security.thirdParty.service': 'Service',
    'security.thirdParty.purpose': 'Purpose',
    'security.thirdParty.dataShared': 'Data Shared',
    'security.thirdParty.openai': 'AI chatbot responses',
    'security.thirdParty.openai.data': 'User messages (not stored by OpenAI)',
    'security.thirdParty.vercel': 'Website hosting',
    'security.thirdParty.vercel.data': 'None (infrastructure only)',
    'security.thirdParty.upstash': 'Chat log storage',
    'security.thirdParty.upstash.data': 'Chat conversations',
    'security.thirdParty.pinecone': 'Document search (RAG)',
    'security.thirdParty.pinecone.data': 'Document embeddings',
    'security.gdpr.title': 'GDPR Compliance',
    'security.gdpr.access.title': 'Right to Access',
    'security.gdpr.access.description': 'Request a copy of your chat logs',
    'security.gdpr.deletion.title': 'Right to Deletion',
    'security.gdpr.deletion.description': 'Request deletion of your data',
    'security.gdpr.object.title': 'Right to Object',
    'security.gdpr.object.description': 'Opt-out of data collection',
    'security.gdpr.minimization.title': 'Data Minimization',
    'security.gdpr.minimization.description': "We only collect what's necessary",
    'security.incident.title': 'Security Incident Response',
    'security.incident.description': 'If you discover a security vulnerability, please report it to:',
    'security.incident.email': 'Email:',
    'security.incident.willDo': 'We will:',
    'security.incident.acknowledge': 'Acknowledge your report within 24 hours',
    'security.incident.investigate': 'Investigate and confirm the issue',
    'security.incident.patch': 'Patch the vulnerability within 7 days (critical) or 30 days (non-critical)',
    'security.incident.notify': 'Notify affected users if necessary',
    'security.compliance.title': 'Compliance & Certifications',
    'security.compliance.https': 'HTTPS/TLS Encryption - All connections encrypted',
    'security.compliance.owasp': 'OWASP Top 10 Protection - Mitigated common vulnerabilities',
    'security.compliance.gdpr': 'GDPR Compliant - User data rights respected',
    'security.compliance.audits': 'Regular Security Audits - Quarterly reviews',
    'security.footer.contact': 'For security or privacy questions, contact:',
    'security.footer.audit': 'Last Security Audit: November 2025 | Next Scheduled Audit: February 2026',
    'security.footer.updated': 'This page is updated regularly. Last update: November 2025',
  },
  vi: {
    // Header Navigation
    'header.home': 'Trang chủ',
    'header.about': 'Giới thiệu',
    'header.projects': 'Dự án',
    'header.blog': 'Blog',
    'header.aiTools': 'Công cụ AI',
    'header.contact': 'Liên hệ',
    'header.admin': 'Quản trị',
    'header.language': 'Ngôn ngữ',
    'header.switchTo': 'English',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. Bảo lưu mọi quyền.',
    'footer.security': 'Bảo mật HTTPS | Tuân thủ GDPR | Không theo dõi',
    'footer.learnMore': 'Tìm hiểu thêm',
    'footer.email': 'Email',
    'footer.linkedin': 'LinkedIn',
    'footer.github': 'GitHub',
    'footer.securityPage': 'Bảo mật',

    // Knowledge/Videos Page
    'knowledge.title': 'Công cụ AI - Thư viện Video',
    'knowledge.subtitle': 'Khám phá các video được tuyển chọn theo danh mục',
    'knowledge.categories.leadership': 'Lãnh đạo',
    'knowledge.categories.aiWorks': 'AI & Công nghệ',
    'knowledge.categories.health': 'Sức khỏe',
    'knowledge.categories.entertaining': 'Giải trí',
    'knowledge.categories.philosophy': 'Triết học con người',
    'knowledge.videoCount': '{count} video',
    'knowledge.browseVideos': 'Duyệt video',
    'knowledge.noVideos': 'Không có video nào',
    'knowledge.noVideosSearch': 'Không tìm thấy video nào phù hợp',
    'knowledge.howItWorks.title': 'Cách hoạt động',
    'knowledge.howItWorks.browse': 'Duyệt video theo danh mục: Lãnh đạo, AI & Công nghệ, Sức khỏe, Giải trí, hoặc Triết học con người',
    'knowledge.howItWorks.transcript': 'Mỗi trang video bao gồm bản ghi đầy đủ và chatbot AI',
    'knowledge.howItWorks.ask': 'Đặt câu hỏi về nội dung video và nhận câu trả lời ngay lập tức',

    // Common
    'common.readMore': 'Đọc thêm',
    'common.loading': 'Đang tải...',
    'common.back': 'Quay lại',
    'common.next': 'Tiếp theo',
    'common.previous': 'Trước đó',
    'common.search': 'Tìm kiếm',
    'common.filter': 'Lọc',
    'common.sort': 'Sắp xếp',

    // Video-related
    'video.transcript': 'Bản ghi',
    'video.summary': 'Tóm tắt',
    'video.duration': 'Thời lượng',
    'video.publishedAt': 'Xuất bản ngày',
    'video.category': 'Danh mục',
    'video.relatedVideos': 'Video liên quan',

    // ChatBot
    'chatbot.title': 'Trợ lý AI',
    'chatbot.placeholder': 'Hỏi tôi bất cứ điều gì...',
    'chatbot.send': 'Gửi',
    'chatbot.thinking': 'Đang suy nghĩ...',
    'chatbot.error': 'Xin lỗi, tôi gặp lỗi. Vui lòng thử lại.',

    // Home Page
    'home.hero.name': 'Đinh Quang Hưng',
    'home.hero.tagline': 'Business Analyst → AI Product Builder',
    'home.hero.description': '20 năm kinh nghiệm Business Analyst trong Giáo dục, FMCG & Sản xuất. Hiện xây dựng sản phẩm AI kết hợp phân tích chặt chẽ với thực thi kỹ thuật.',
    'home.hero.viewProjects': 'Xem dự án',
    'home.hero.aboutMe': 'Giới thiệu',
    'home.hero.downloadCV': 'Tải CV',
    'home.hero.loadingCV': 'Đang tải...',
    'home.values.title1': 'Tư duy vấn đề trước',
    'home.values.desc1': 'Hiểu sâu vấn đề trước khi đưa ra giải pháp',
    'home.values.title2': 'Con Người + AI',
    'home.values.desc2': 'AI là đối tác tư duy, không chỉ là công cụ - chúng ta cộng tác để giải quyết vấn đề thực tế, không theo đuổi công nghệ',
    'home.values.title3': 'Xây dựng công khai',
    'home.values.desc3': 'Chia sẻ thất bại và bài học để giúp người khác phát triển',
    'home.featured.projects': 'Dự án nổi bật',
    'home.featured.projectsPlaceholder': 'Dự án sắp ra mắt... Đang xây dựng! 🚀',
    'home.featured.latestPosts': 'Bài viết mới nhất',
    'home.featured.postsPlaceholder': 'Blog sắp ra mắt... Hãy đón chờ! ✍️',

    // Origin Story Section
    'home.origin.title': 'Nơi Mọi Thứ Bắt Đầu',
    'home.origin.act1': 'Sau một tháng đào sâu vào AI, tôi nhận ra điều gì đó sâu sắc: AI không chỉ là một hệ thống khác. Không giống SAP, không giống bất kỳ công cụ nào tôi từng làm việc cùng. Đây là "Trí Tuệ Máy" - Machine Intelligence - thứ vượt xa trí tưởng tượng của tôi về những gì công nghệ có thể làm.',
    'home.origin.act2.intro': 'Khi khả năng của AI ngày càng rõ ràng, một câu hỏi xuất hiện:',
    'home.origin.act2.question': 'Điều gì khiến chúng ta TRỞ NÊN HUMAN HƠN trong thời đại AI?',
    'home.origin.act3.intro': 'Câu trả lời của tôi đến thông qua dự án "Văn Hóa Gia Đình" - một framework về giá trị gia đình không chỉ dành cho gia đình, mà cho bất kỳ tổ chức, nhóm, hay cộng đồng nào.',
    'home.origin.act3.closing': 'Đây không phải về việc xây dựng AI để thay thế con người, mà về việc sử dụng AI để giúp chúng ta nhớ lại điều gì khiến chúng ta trở nên con người.',

    // About Page
    'about.title': 'Giới thiệu',
    'about.subtitle': '20 năm kinh nghiệm lãnh đạo IT, hiện đang chuyển hướng sang Product Management với trọng tâm là AI',
    'about.photo': 'Ảnh',
    'about.name': 'Đinh Quang Hưng',
    'about.role': 'Lãnh đạo IT | Chuyên gia AI | Đam mê Product Management',
    'about.intro': 'Sẵn sàng cho những cơ hội mới để tạo giá trị, thử thách khả năng lãnh đạo và tiếp tục hành trình học hỏi. Với 8 năm kinh nghiệm Trưởng phòng IT và 20 năm làm việc tại các công ty đa quốc gia (FMCG, Sản xuất, Giáo dục K12), hiện tập trung vào sản phẩm AI và Product Management.',
    'about.journey.title': 'Hành trình nghề nghiệp',
    'about.education.title': 'Học vấn & Chuyên môn',
    'about.education.subtitle': 'Học vấn',
    'about.education.mba': 'MBA - Kinh doanh trong IT, Đại học Công nghệ Sydney (UTS), Úc (2001-2003)',
    'about.education.bachelor': 'Cử nhân Thương mại - Kinh tế & Tài chính, Đại học Macquarie, Úc (1997-2001)',
    'about.education.diploma': 'Văn bằng Thương mại - Kinh tế Kinh doanh, Viện Insearch, Úc (1996-1997)',
    'about.currentFocus.title': 'Định hướng hiện tại',
    'about.currentFocus.ai': 'Học viên và thực hành AI (AI chatbots, ứng dụng AI, AI Agents với n8n)',
    'about.currentFocus.pm': 'Chuyển đổi sang Product Management',
    'about.currentFocus.team': 'Quản lý đội nhóm & lãnh đạo',
    'about.currentFocus.sap': 'Hệ thống SAP ERP',
    'about.currentFocus.itsm': 'Quản lý Dịch vụ IT',
    'about.training.title': 'Đào tạo & Phát triển',
    'about.competencies.title': 'Năng lực cốt lõi',
    'about.competency.integrity': 'Chính trực',
    'about.competency.respect': 'Tôn trọng người khác',
    'about.competency.accountability': 'Trách nhiệm',
    'about.competency.learning': 'Thái độ học hỏi',
    'about.competency.english': 'Giao tiếp tiếng Anh xuất sắc',
    'about.competency.leadership': 'Lãnh đạo đội nhóm',
    'about.beyond.title': 'Ngoài công việc',
    'about.beyond.bio': 'Sinh ngày 9/3/1975. Đã kết hôn, quốc tịch Việt Nam, sống tại Quận 3, TP.HCM.',
    'about.beyond.interests': 'Khi không làm việc với các giải pháp IT hoặc học về AI, bạn sẽ thấy tôi chạy bộ hoặc du lịch. Tôi tin vào việc học hỏi liên tục và thử thách bản thân với những cơ hội mới. 20 năm kinh nghiệm qua nhiều ngành khác nhau đã dạy tôi rằng giải pháp tốt nhất đến từ việc hiểu con người trước, sau đó mới áp dụng công nghệ.',

    // Projects Page
    'projects.title': 'Dự án',
    'projects.subtitle': 'Các giải pháp AI được xây dựng để giải quyết vấn đề thực tế',
    'projects.empty': 'Dự án sắp ra mắt... Đang xây dựng! 🚀',
    'projects.emptySubtitle': 'Quay lại sau để xem các dự án AI',
    'projects.backToProjects': '← Quay lại Dự án',
    'projects.viewGithub': 'Xem trên GitHub',
    'projects.liveDemo': 'Demo trực tiếp',
    'projects.keyLearnings': 'Bài học quan trọng',
    'projects.relatedProjects': 'Dự án liên quan',
    'projects.screenshots': 'Hình ảnh',
    'projects.viewCode': 'Xem mã nguồn',

    // Blog Page
    'blog.title': 'Blog',
    'blog.subtitle': 'Suy nghĩ về product management, AI và bài học trên hành trình',
    'blog.empty': 'Bài viết sắp ra mắt... Hãy đón chờ! ✍️',
    'blog.emptySubtitle': 'Bài viết đầu tiên sẽ về chuyển đổi từ BA sang PM và học AI',
    'blog.backToBlog': '← Quay lại Blog',
    'blog.minRead': 'phút đọc',
    'blog.thanks': 'Cảm ơn bạn đã đọc! Nếu thấy hữu ích, hãy chia sẻ hoặc kết nối qua',
    'blog.linkedin': 'LinkedIn',

    // Contact Page
    'contact.title': 'Liên hệ',
    'contact.subtitle': 'Có câu hỏi hoặc muốn làm việc cùng nhau? Hãy liên hệ!',
    'contact.email.label': 'Email',
    'contact.linkedin.label': 'LinkedIn',
    'contact.linkedin.description': 'Kết nối với tôi',
    'contact.github.label': 'GitHub',
    'contact.github.description': 'Xem code của tôi',

    // Security Page
    'security.title': 'Bảo mật & Quyền riêng tư',
    'security.subtitle': 'Tại Hungreo, chúng tôi coi trọng bảo mật và quyền riêng tư dữ liệu của bạn. Trang này mô tả các biện pháp chúng tôi đã triển khai để bảo vệ thông tin của bạn.',
    'security.lastUpdated': 'Cập nhật lần cuối: Tháng 11, 2025',
    'security.commitment.title': 'Cam kết bảo mật',
    'security.commitment.description': 'Chúng tôi triển khai các phương pháp bảo mật tiêu chuẩn ngành để đảm bảo dữ liệu của bạn luôn được bảo vệ. Website được bảo mật bằng mã hóa HTTPS, giới hạn tốc độ và xác thực đầu vào toàn diện.',
    'security.features.title': 'Tính năng bảo mật',
    'security.dataProtection.title': '1. Bảo vệ dữ liệu',
    'security.dataProtection.https': 'Kết nối được mã hóa: Tất cả dữ liệu truyền giữa trình duyệt và máy chủ được mã hóa bằng HTTPS/TLS.',
    'security.dataProtection.noPersonal': 'Không thu thập dữ liệu cá nhân: Chatbot không thu thập hoặc lưu trữ thông tin cá nhân (tên, email, số điện thoại).',
    'security.dataProtection.storage': 'Lưu trữ an toàn: Chat logs được lưu trong cơ sở dữ liệu mã hóa và tự động xóa sau 90 ngày.',
    'security.rateLimiting.title': '2. Giới hạn tốc độ & Ngăn chặn lạm dụng',
    'security.rateLimiting.chatbot': 'Giới hạn Chatbot: Tối đa 10 tin nhắn/phút để ngăn spam và lạm dụng.',
    'security.rateLimiting.admin': 'Bảo vệ Admin: Giới hạn 5 lần đăng nhập/15 phút với khóa tự động.',
    'security.rateLimiting.upload': 'Giới hạn Upload: Tối đa 5 file/10 phút để ngăn lạm dụng lưu trữ.',
    'security.inputValidation.title': '3. Xác thực đầu vào',
    'security.inputValidation.xss': 'Ngăn chặn XSS: Tất cả đầu vào được làm sạch để ngăn tấn công cross-site scripting.',
    'security.inputValidation.fileType': 'Xác thực loại file: Chỉ cho phép các loại file an toàn (PDF, DOCX, TXT).',
    'security.inputValidation.messageLength': 'Giới hạn độ dài tin nhắn: Chat messages giới hạn 1-1000 ký tự.',
    'security.dataCollection.title': 'Dữ liệu chúng tôi thu thập',
    'security.dataCollection.chatbot.title': 'Hội thoại Chatbot',
    'security.dataCollection.chatbot.what': 'Chúng tôi thu thập gì: Câu hỏi của bạn, phản hồi AI, thời gian, ngữ cảnh trang',
    'security.dataCollection.chatbot.why': 'Tại sao thu thập: Để cải thiện độ chính xác chatbot và trải nghiệm người dùng',
    'security.dataCollection.chatbot.howLong': 'Lưu bao lâu: 90 ngày (tự động xóa)',
    'security.dataCollection.chatbot.whoAccess': 'Ai có thể truy cập: Chỉ Admin (không bán hoặc chia sẻ với bên thứ ba)',
    'security.dataCollection.chatbot.rights': 'Quyền của bạn: Bạn có thể yêu cầu xóa dữ liệu bất cứ lúc nào',
    'security.dataCollection.noPersonal.title': 'Không định danh cá nhân',
    'security.dataCollection.noPersonal.description': 'Chúng tôi không thu thập:',
    'security.dataCollection.noPersonal.names': 'Tên',
    'security.dataCollection.noPersonal.email': 'Địa chỉ email (trừ admin login)',
    'security.dataCollection.noPersonal.phone': 'Số điện thoại',
    'security.dataCollection.noPersonal.ip': 'Địa chỉ IP (chỉ dùng để giới hạn tốc độ, không lưu dài hạn)',
    'security.dataCollection.noPersonal.location': 'Dữ liệu vị trí',
    'security.thirdParty.title': 'Dịch vụ bên thứ ba',
    'security.thirdParty.description': 'Chúng tôi sử dụng các dịch vụ đáng tin cậy sau:',
    'security.thirdParty.service': 'Dịch vụ',
    'security.thirdParty.purpose': 'Mục đích',
    'security.thirdParty.dataShared': 'Dữ liệu chia sẻ',
    'security.thirdParty.openai': 'Phản hồi AI chatbot',
    'security.thirdParty.openai.data': 'Tin nhắn người dùng (không lưu bởi OpenAI)',
    'security.thirdParty.vercel': 'Hosting website',
    'security.thirdParty.vercel.data': 'Không có (chỉ hạ tầng)',
    'security.thirdParty.upstash': 'Lưu trữ chat logs',
    'security.thirdParty.upstash.data': 'Hội thoại chat',
    'security.thirdParty.pinecone': 'Tìm kiếm tài liệu (RAG)',
    'security.thirdParty.pinecone.data': 'Embeddings tài liệu',
    'security.gdpr.title': 'Tuân thủ GDPR',
    'security.gdpr.access.title': 'Quyền truy cập',
    'security.gdpr.access.description': 'Yêu cầu bản sao chat logs',
    'security.gdpr.deletion.title': 'Quyền xóa',
    'security.gdpr.deletion.description': 'Yêu cầu xóa dữ liệu',
    'security.gdpr.object.title': 'Quyền phản đối',
    'security.gdpr.object.description': 'Từ chối thu thập dữ liệu',
    'security.gdpr.minimization.title': 'Tối thiểu hóa dữ liệu',
    'security.gdpr.minimization.description': 'Chỉ thu thập những gì cần thiết',
    'security.incident.title': 'Phản ứng sự cố bảo mật',
    'security.incident.description': 'Nếu phát hiện lỗ hổng bảo mật, vui lòng báo cáo tới:',
    'security.incident.email': 'Email:',
    'security.incident.willDo': 'Chúng tôi sẽ:',
    'security.incident.acknowledge': 'Xác nhận báo cáo trong 24 giờ',
    'security.incident.investigate': 'Điều tra và xác nhận vấn đề',
    'security.incident.patch': 'Vá lỗ hổng trong 7 ngày (nghiêm trọng) hoặc 30 ngày (không nghiêm trọng)',
    'security.incident.notify': 'Thông báo cho người dùng bị ảnh hưởng nếu cần',
    'security.compliance.title': 'Tuân thủ & Chứng chỉ',
    'security.compliance.https': 'Mã hóa HTTPS/TLS - Tất cả kết nối được mã hóa',
    'security.compliance.owasp': 'Bảo vệ OWASP Top 10 - Giảm thiểu lỗ hổng phổ biến',
    'security.compliance.gdpr': 'Tuân thủ GDPR - Tôn trọng quyền dữ liệu người dùng',
    'security.compliance.audits': 'Kiểm tra bảo mật định kỳ - Hàng quý',
    'security.footer.contact': 'Câu hỏi về bảo mật hoặc quyền riêng tư, liên hệ:',
    'security.footer.audit': 'Kiểm tra bảo mật lần cuối: Tháng 11/2025 | Kiểm tra tiếp theo: Tháng 2/2026',
    'security.footer.updated': 'Trang này được cập nhật thường xuyên. Cập nhật lần cuối: Tháng 11/2025',
  },
}

/**
 * Language Provider Component
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'en' || saved === 'vi')) {
      setLanguageState(saved)
    }
  }, [])

  // Save to localStorage when language changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  // Translation function with dynamic variable replacement
  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']]
    return translation || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * Custom hook to use Language Context
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
