// Translation system for multi-language support

type SupportedLanguage = 'en' | 'ar';

interface TranslationContent {
  [key: string]: string;
}

interface TranslationSet {
  en: TranslationContent;
  ar: TranslationContent;
}

const translations: TranslationSet = {
  en: {
    // General
    "bot_name": "Win Lock",
    "bot_description": "Fantasy/eSports League Management Bot",
    
    // Commands
    "cmd_setup": "Setup the league",
    "cmd_teams_add": "Add a team & emoji pair",
    "cmd_teams_view": "View the teams",
    "cmd_teams_remove": "Remove a team & emoji pair",
    "cmd_teams_edit": "Change a team's paired emoji",
    "cmd_teamsalaries": "View a list of the teams salaries",
    "cmd_teamowners": "View a list of the team owners",
    "cmd_teamtemplates": "Create team roles & emojis for your league",
    
    // Setup Wizard
    "setup_title": "Win Lock Community Setup",
    "setup_page_title": "Page {current}/{total}",
    "setup_peerless": "Peerless Setup",
    "setup_auto_detect": "Use /detectsettings if you want to auto-detect settings prior to using this command",
    "setup_page1": "This Page",
    "setup_page2": "Custom Teams",
    "setup_page3": "Custom Coaches",
    "setup_page4": "League Staff",
    "setup_page5": "Basic Transaction Settings",
    "setup_page6": "Advanced Transaction Settings",
    "setup_page7": "Demand Settings",
    "setup_page8": "Season Settings",
    "setup_page9": "Notice Settings",
    "setup_page10": "Miscellaneous Settings",
    
    // Teams management
    "teams_title": "Custom Teams",
    "teams_skip_info": "If you want to skip this or add each team individually, click Next Page",
    "teams_confused": "If you're confused on what to do, click the 'Custom Team Type' menu below",
    "teams_header": "Teams",
    "team_added": "Team {name} added successfully with emoji {emoji}",
    "team_removed": "Team {name} removed",
    "team_not_found": "Team not found",
    "team_already_exists": "Team already exists",
    "invalid_emoji": "Invalid emoji format",
    
    // Coaches
    "coaches_title": "Custom Coaches",
    "coaches_skip_info": "If you want to skip this or add each coach role individually, click Next Page",
    "coaches_confused": "If you're confused on what to do, click the 'Custom Coach Type' menu below",
    "coaches_header": "Coaches",
    "coach_added": "Coach role {name} added successfully with code {code}",
    "coach_removed": "Coach role {name} removed",
    "coach_not_found": "Coach role not found",
    "coach_already_exists": "Coach role already exists",
    
    // Roster
    "roster_title": "Win Lock Community Roster Counts",
    "empty_teams": "Empty Teams",
    "roster_capacity": "{current}/{max}",
    
    // Currency
    "currency_updated": "Currency updated for team {team}",
    "insufficient_funds": "Insufficient funds for this transaction",
    "win_award": "Your team earned {amount} for winning!",
    "loss_award": "Your team earned {amount} for participating.",
    
    // Transactions
    "transaction_created": "Transaction created and pending approval",
    "transaction_approved": "Transaction approved",
    "transaction_rejected": "Transaction rejected",
    "transaction_cancelled": "Transaction cancelled",
    
    // Roles
    "role_operator": "Operator",
    "role_operator_desc": "Allows users to use every command that the bot has",
    "role_manager": "Manager",
    "role_manager_desc": "Allows users to use franchise commands plus blacklist & waitlist commands",
    "role_manager_desc2": "Allows users to make decisions on challenges",
    "role_referee": "Referee",
    "role_streamer": "Streamer",
    "role_streamer_desc": "Allows users to use /stream",
    
    // Channels
    "channel_challenges": "Challenges",
    "channel_challenges_desc": "Sends challenges into this channel from /challenges",
    "channel_decisions": "Decisions",
    "channel_decisions_desc": "Sends decisions into this channel",
    "channel_notices": "Notices",
    "channel_notices_desc": "Sends all notices/league logs/alerts into this channel",
    "channel_setting_changes": "Setting Changes",
    "channel_setting_changes_desc": "Sends setting changes into this channel",
    "channel_streams": "Streams",
    "channel_streams_desc": "Sends stream pings into this channel",
    
    // UI Elements
    "next_page": "Next Page",
    "previous_page": "Previous Page",
    "go_to_page": "Go to Page",
    "detect_custom_teams": "Detect Custom Teams",
    "detect_custom_coaches": "Detect Custom Coaches",
    "custom_team_type": "Custom Team Type",
    "custom_coach_type": "Custom Coach Type",
    "dismiss_message": "Dismiss message",
    
    // Errors
    "error_permission": "You don't have permission to use this command",
    "error_setup_incomplete": "Please complete the setup wizard first",
    "error_invalid_input": "Invalid input",
    "error_channel_not_found": "Channel not found",
    "error_user_not_found": "User not found",
    "error_role_not_found": "Role not found"
  },
  ar: {
    // General
    "bot_name": "وين لوك",
    "bot_description": "روبوت إدارة دوري الفانتازي/الرياضات الإلكترونية",
    
    // Commands
    "cmd_setup": "إعداد الدوري",
    "cmd_teams_add": "إضافة فريق ورمز تعبيري",
    "cmd_teams_view": "عرض الفرق",
    "cmd_teams_remove": "إزالة فريق ورمز تعبيري",
    "cmd_teams_edit": "تغيير رمز تعبيري مقترن بفريق",
    "cmd_teamsalaries": "عرض قائمة رواتب الفرق",
    "cmd_teamowners": "عرض قائمة مالكي الفريق",
    "cmd_teamtemplates": "إنشاء أدوار ورموز الفريق لدوريك",
    
    // Setup Wizard
    "setup_title": "إعداد مجتمع وين لوك",
    "setup_page_title": "صفحة {current}/{total}",
    "setup_peerless": "إعداد بيرلس",
    "setup_auto_detect": "استخدم /detectsettings إذا كنت تريد الكشف التلقائي عن الإعدادات قبل استخدام هذا الأمر",
    "setup_page1": "هذه الصفحة",
    "setup_page2": "فرق مخصصة",
    "setup_page3": "مدربين مخصصين",
    "setup_page4": "طاقم الدوري",
    "setup_page5": "إعدادات المعاملات الأساسية",
    "setup_page6": "إعدادات المعاملات المتقدمة",
    "setup_page7": "إعدادات الطلب",
    "setup_page8": "إعدادات الموسم",
    "setup_page9": "إعدادات الإشعارات",
    "setup_page10": "إعدادات متنوعة",
    
    // Teams management
    "teams_title": "فرق مخصصة",
    "teams_skip_info": "إذا كنت تريد تخطي هذا أو إضافة كل فريق على حدة، انقر على الصفحة التالية",
    "teams_confused": "إذا كنت مرتبكًا بشأن ما يجب عليك فعله، انقر على قائمة 'نوع الفريق المخصص' أدناه",
    "teams_header": "الفرق",
    "team_added": "تمت إضافة الفريق {name} بنجاح مع الرمز التعبيري {emoji}",
    "team_removed": "تمت إزالة الفريق {name}",
    "team_not_found": "الفريق غير موجود",
    "team_already_exists": "الفريق موجود بالفعل",
    "invalid_emoji": "تنسيق الرمز التعبيري غير صالح",
    
    // Coaches
    "coaches_title": "مدربين مخصصين",
    "coaches_skip_info": "إذا كنت تريد تخطي هذا أو إضافة كل دور مدرب بشكل فردي، انقر على الصفحة التالية",
    "coaches_confused": "إذا كنت مرتبكًا بشأن ما يجب عليك فعله، انقر على قائمة 'نوع المدرب المخصص' أدناه",
    "coaches_header": "المدربين",
    "coach_added": "تمت إضافة دور المدرب {name} بنجاح مع الرمز {code}",
    "coach_removed": "تمت إزالة دور المدرب {name}",
    "coach_not_found": "دور المدرب غير موجود",
    "coach_already_exists": "دور المدرب موجود بالفعل",
    
    // Roster
    "roster_title": "عدد قوائم مجتمع وين لوك",
    "empty_teams": "فرق فارغة",
    "roster_capacity": "{current}/{max}",
    
    // Currency
    "currency_updated": "تم تحديث العملة للفريق {team}",
    "insufficient_funds": "رصيد غير كافٍ لهذه المعاملة",
    "win_award": "حصل فريقك على {amount} للفوز!",
    "loss_award": "حصل فريقك على {amount} للمشاركة.",
    
    // Transactions
    "transaction_created": "تم إنشاء المعاملة وفي انتظار الموافقة",
    "transaction_approved": "تمت الموافقة على المعاملة",
    "transaction_rejected": "تم رفض المعاملة",
    "transaction_cancelled": "تم إلغاء المعاملة",
    
    // Roles
    "role_operator": "مشغّل",
    "role_operator_desc": "يسمح للمستخدمين باستخدام كل أمر لدى الروبوت",
    "role_manager": "مدير",
    "role_manager_desc": "يسمح للمستخدمين باستخدام أوامر الامتياز بالإضافة إلى أوامر القائمة السوداء وقائمة الانتظار",
    "role_manager_desc2": "يسمح للمستخدمين باتخاذ قرارات بشأن التحديات",
    "role_referee": "حكم",
    "role_streamer": "بث مباشر",
    "role_streamer_desc": "يسمح للمستخدمين باستخدام /stream",
    
    // Channels
    "channel_challenges": "تحديات",
    "channel_challenges_desc": "يرسل التحديات إلى هذه القناة من /challenges",
    "channel_decisions": "قرارات",
    "channel_decisions_desc": "يرسل القرارات إلى هذه القناة",
    "channel_notices": "إشعارات",
    "channel_notices_desc": "يرسل جميع الإشعارات/سجلات الدوري/تنبيهات إلى هذه القناة",
    "channel_setting_changes": "تغييرات الإعدادات",
    "channel_setting_changes_desc": "يرسل تغييرات الإعدادات إلى هذه القناة",
    "channel_streams": "بث مباشر",
    "channel_streams_desc": "يرسل إشارات البث المباشر إلى هذه القناة",
    
    // UI Elements
    "next_page": "الصفحة التالية",
    "previous_page": "الصفحة السابقة",
    "go_to_page": "اذهب إلى الصفحة",
    "detect_custom_teams": "اكتشاف الفرق المخصصة",
    "detect_custom_coaches": "اكتشاف المدربين المخصصين",
    "custom_team_type": "نوع الفريق المخصص",
    "custom_coach_type": "نوع المدرب المخصص",
    "dismiss_message": "تجاهل الرسالة",
    
    // Errors
    "error_permission": "ليس لديك إذن لاستخدام هذا الأمر",
    "error_setup_incomplete": "يرجى إكمال معالج الإعداد أولاً",
    "error_invalid_input": "إدخال غير صالح",
    "error_channel_not_found": "القناة غير موجودة",
    "error_user_not_found": "المستخدم غير موجود",
    "error_role_not_found": "الدور غير موجود"
  }
};

// Get the translation for a key in the specified language
export function getTranslation(key: string, lang: SupportedLanguage = 'en'): string {
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  
  // Fallback to English if translation not found
  if (translations.en[key]) {
    return translations.en[key];
  }
  
  // Return the key if no translation found
  return key;
}

// Format translation with variables
export function formatTranslation(key: string, lang: SupportedLanguage = 'en', variables: { [key: string]: string | number } = {}): string {
  let translation = getTranslation(key, lang);
  
  // Replace variables in the translation string
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.replace(new RegExp(`{${varKey}}`, 'g'), String(value));
  });
  
  return translation;
}

// Auto-detect the language based on input text
export function detectLanguage(text: string): SupportedLanguage {
  // Simple detection - if there are Arabic characters, return Arabic, otherwise English
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? 'ar' : 'en';
}
