/**
 * SevaKhata — English / Hindi language toggle.
 *
 * Static text: elements carry data-i18n="key" (also data-i18n-placeholder and
 * data-i18n-aria). The English text already in the HTML is the source of truth;
 * it is remembered on first use so switching back to English restores it exactly.
 * Dynamic text (rendered by page scripts) goes through SKI18N.t(key, fallback).
 * The chosen language is saved in localStorage ("sk_lang") and shared by all pages.
 *
 * Vocabulary follows the project README: सही है (Confirm), गलत है (Dispute),
 * विचाराधीन (Pending), स्वीकृत (Confirmed), विवादित (Disputed).
 */
(function () {
  'use strict';

  /* English strings for text built in JavaScript (static HTML text needs no entry here). */
  const EN = {
    'common.reference': 'Reference', 'common.close': 'Close', 'common.fixErrors': 'Please fix the highlighted fields.',
    'common.error': 'Something went wrong. Please try again.', 'common.exported': 'Downloaded {file} ({n} records).',
    'common.exportFail': 'Could not export the file.', 'common.savedServer': 'Saved to the JSON file on the server.',
    'common.savedLocal': 'Server not running, so this was saved in your browser. Use “Export JSON” to download the file.',
    'common.all': 'All', 'common.any': 'Any', 'common.select': 'Select…', 'common.loading': 'Loading…',
    'common.perDay': '/day', 'common.perMonth': '/month', 'common.years': 'yrs', 'common.hire': 'Hire', 'common.request': 'Request',
    'sync.server': 'Live server · saving to data/*.json', 'sync.offline': 'Offline demo · saving in this browser', 'sync.checking': 'Checking server…',
    'status.pending': 'Pending', 'status.confirmed': 'Confirmed', 'status.disputed': 'Disputed',
    'type.attendance': 'Work / attendance', 'type.payment': 'Payment', 'type.advance': 'Advance', 'type.bonus': 'Bonus',
    'att.full': 'Full day', 'att.half': 'Half day', 'att.extra': 'Extra work', 'att.absent': 'Leave / absent',
    'cat.cook': 'Cook', 'cat.maid': 'Maid / housekeeping', 'cat.driver': 'Driver', 'cat.caregiver': 'Caregiver', 'cat.gardener': 'Gardener', 'cat.other': 'Other',
    'id.aadhaar': 'Aadhaar', 'id.voter': 'Voter ID', 'id.dl': 'Driving licence', 'id.pan': 'PAN',
    'badge.verified': 'Verified', 'badge.pending': 'Verification pending',
    'led.confirm': '✅ Confirm', 'led.dispute': '⚠️ Dispute',
    'sup.kindSupport': 'Support ticket', 'sup.kindFeedback': 'Feedback', 'sup.kindVerification': 'Verification issue',
    'dir.tier.high': 'High', 'dir.tier.good': 'Good', 'dir.tier.building': 'Building', 'dir.tier.new': 'New',
    'v.required': 'This field is required.', 'v.phone': 'Enter a valid 10-digit Indian mobile number (starts with 6–9).',
    'v.email': 'Enter a valid email address.', 'v.name': 'Use letters and spaces only.', 'v.number': 'Enter a valid number.',
    'v.positive': 'Enter an amount greater than 0.', 'v.choice': 'Please choose a valid option.', 'v.date': 'Enter a valid date.',
    'v.dateFuture': 'Date cannot be in the future.', 'v.datePast': 'Date cannot be in the past.',
    'v.consent': 'Please agree before submitting.', 'v.rating': 'Please give a rating.', 'v.chooseWorker': 'Please pick the helper.',
    'v.skills': 'Add at least one skill (2+ letters each, comma separated).',
    'nav.login': 'Login', 'v.password': 'Password must be at least 6 characters.', 'v.otp': 'Please enter a valid 4-to-6 digit code.',
    'login.success': 'Signed in successfully. Welcome to SevaKhata.',
    'login.otpSent': 'Verification code sent to {phone}.',
    'login.forgotTitle': 'Password Assistance',
    'login.forgotBody': 'In this Evaluation 2 preview, live email delivery is mocked. For account recovery assistance or help logging in, please contact support or use Mobile login.'
  };

  const HI = {
    /* navigation, footer, shared */
    'nav.home': 'होम', 'nav.hire': 'काम पर रखें', 'nav.register': 'पंजीकरण', 'nav.directory': 'सूची', 'nav.ledger': 'खाता', 'nav.support': 'सहायता', 'nav.login': 'लॉगिन',
    'nav.language': 'भाषा', 'nav.menu': 'मेन्यू',
    'footer.tagline': 'साझा घरेलू रोज़गार खाता।', 'footer.copy': '© 2026 सेवाखाता। भारतीय घरों में आपसी भरोसे और सम्मान के लिए बनाया गया।',
    'common.skip': 'मुख्य सामग्री पर जाएँ', 'common.exportJson': 'JSON डाउनलोड करें', 'common.optional': '(वैकल्पिक)', 'common.reset': 'फ़ॉर्म साफ़ करें',
    'common.search': 'खोजें', 'common.clearFilters': 'फ़िल्टर हटाएँ', 'common.daily': 'रोज़ाना', 'common.monthly': 'मासिक',
    'common.reference': 'संदर्भ', 'common.close': 'बंद करें', 'common.fixErrors': 'कृपया लाल निशान वाले खाने ठीक करें।',
    'common.error': 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।', 'common.exported': '{file} डाउनलोड हुई ({n} रिकॉर्ड)।',
    'common.exportFail': 'फ़ाइल डाउनलोड नहीं हो सकी।', 'common.savedServer': 'सर्वर की JSON फ़ाइल में सहेजा गया।',
    'common.savedLocal': 'सर्वर चालू नहीं है, इसलिए यह आपके ब्राउज़र में सहेजा गया। फ़ाइल पाने के लिए “JSON डाउनलोड करें” दबाएँ।',
    'common.all': 'सभी', 'common.any': 'कोई भी', 'common.select': 'चुनें…', 'common.loading': 'लोड हो रहा है…',
    'common.perDay': '/दिन', 'common.perMonth': '/माह', 'common.years': 'वर्ष', 'common.hire': 'काम पर रखें', 'common.request': 'अनुरोध',
    'sync.server': 'सर्वर चालू · data/*.json में सहेज रहा है', 'sync.offline': 'ऑफ़लाइन डेमो · इसी ब्राउज़र में सहेज रहा है', 'sync.checking': 'सर्वर जाँच रहे हैं…',

    /* statuses, types, categories */
    'status.pending': 'विचाराधीन', 'status.confirmed': 'स्वीकृत', 'status.disputed': 'विवादित',
    'type.attendance': 'काम / हाज़िरी', 'type.payment': 'भुगतान', 'type.advance': 'पेशगी (अग्रिम)', 'type.bonus': 'बोनस',
    'att.full': 'पूरा दिन', 'att.half': 'आधा दिन', 'att.extra': 'अतिरिक्त कार्य', 'att.absent': 'छुट्टी',
    'cat.cook': 'रसोइया', 'cat.maid': 'घरेलू सहायिका', 'cat.driver': 'ड्राइवर', 'cat.caregiver': 'देखभालकर्ता', 'cat.gardener': 'माली', 'cat.other': 'अन्य',
    'id.aadhaar': 'आधार', 'id.voter': 'वोटर आईडी', 'id.dl': 'ड्राइविंग लाइसेंस', 'id.pan': 'पैन',
    'badge.verified': 'सत्यापित', 'badge.pending': 'सत्यापन बाकी',

    /* validation messages */
    'v.required': 'यह जानकारी भरना ज़रूरी है।', 'v.minLen': 'कृपया कम से कम {n} अक्षर लिखें।', 'v.maxLen': 'कृपया {n} अक्षरों से कम लिखें।',
    'v.phone': 'सही 10 अंकों का मोबाइल नंबर लिखें (6 से 9 से शुरू)।', 'v.email': 'सही ईमेल पता लिखें।', 'v.name': 'केवल अक्षर और खाली जगह लिखें।',
    'v.number': 'सही संख्या लिखें।', 'v.positive': 'राशि 0 से ज़्यादा होनी चाहिए।', 'v.min': 'मान कम से कम {n} होना चाहिए।', 'v.max': 'मान अधिकतम {n} हो सकता है।',
    'v.choice': 'कृपया सही विकल्प चुनें।', 'v.date': 'सही तारीख़ चुनें।', 'v.dateFuture': 'तारीख़ आगे की नहीं हो सकती।', 'v.datePast': 'तारीख़ बीती हुई नहीं हो सकती।',
    'v.consent': 'आगे बढ़ने से पहले सहमति दें।', 'v.rating': 'कृपया रेटिंग दें।', 'v.chooseWorker': 'कृपया सहायक चुनें।',
    'v.skills': 'कम से कम एक हुनर लिखें (हर हुनर 2+ अक्षर, कॉमा से अलग)।', 'v.idLast4': 'पहचान संदर्भ ठीक 4 अक्षर/अंक का होना चाहिए।',
    'v.id.aadhaar': 'आधार 12 अंकों का होना चाहिए और 0 या 1 से शुरू नहीं हो सकता।', 'v.id.voter': 'वोटर आईडी ऐसा दिखता है: ABC1234567।',
    'v.id.dl': 'ड्राइविंग लाइसेंस ऐसा दिखता है: HR0620110012345।', 'v.id.pan': 'पैन ऐसा दिखता है: ABCDE1234F।',
    'v.password': 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।', 'v.otp': 'कृपया सही 4 से 6 अंकों का कोड दर्ज करें।',
    'login.success': 'सफलतापूर्वक प्रवेश किया। सेवाखाता में आपका स्वागत है।',
    'login.otpSent': '{phone} पर सत्यापन कोड भेजा गया।',
    'login.forgotTitle': 'पासवर्ड सहायता',
    'login.forgotBody': 'इस मूल्यांकन 2 पूर्वावलोकन में, लाइव ईमेल वितरण डेमो मोड में है। खाता पुनर्प्राप्ति या लॉगिन सहायता के लिए, कृपया सहायता से संपर्क करें या मोबाइल लॉगिन का उपयोग करें।',
    'login.eyebrow': 'खाता प्रमाणीकरण',
    'login.title': 'खाते में प्रवेश करें',
    'login.lead': 'अपने साझा खाते तक पहुँचने, दैनिक कार्य की समीक्षा करने और हिसाब सत्यापित करने के लिए लॉगिन करें। जो दोनों मानें, वही आधिकारिक सत्य बनता है।',
    'login.tabEmail': 'ईमेल और पासवर्ड',
    'login.tabMobile': 'मोबाइल और ओटीपी',
    'login.email': 'ईमेल पता',
    'login.email.ph': 'sharma.household@example.com',
    'login.password': 'पासवर्ड',
    'login.password.ph': '••••••••',
    'login.showPass': 'पासवर्ड दिखाएँ',
    'login.hidePass': 'पासवर्ड छिपाएँ',
    'login.remember': 'इस डिवाइस को याद रखें',
    'login.forgot': 'पासवर्ड भूल गए?',
    'login.submitEmail': 'सेवाखाता में प्रवेश करें',
    'login.phone': 'मोबाइल नंबर',
    'login.phone.ph': '98100 12345',
    'login.phone.hint': '10 अंकों का भारतीय मोबाइल नंबर लिखें (6–9 से शुरू)।',
    'login.sendOtp': 'सत्यापन कोड प्राप्त करें',
    'login.otp': 'सत्यापन कोड (ओटीपी)',
    'login.otp.hint': 'डेमो मोड: कोई भी 6-अंकीय कोड सत्यापित करेगा।',
    'login.verifyOtp': 'सत्यापित करें और खाते में जाएँ',
    'login.changePhone': 'बदलें',
    'login.noAccount': 'खाता नहीं है?',
    'login.registerHelper': 'सहायक पंजीकरण →',
    'login.hireHelper': 'सहायक रखें →',
    'login.disclaimer': 'प्रोटोटाइप पूर्वावलोकन: वास्तविक एसएमएस गेटवे और जेडब्ल्यूटी सत्र मूल्यांकन 3 के लिए नियोजित हैं। क्रेडेंशियल्स सुरक्षित हैं।',

    /* landing page gateways */
    'gw.eyebrow': 'मूल्यांकन 2 · कार्यप्रवाह', 'gw.title': 'हर कदम, एक ही जगह',
    'gw.lead': 'सहायक पंजीकृत करें, काम पर रखें, दिन का काम और भुगतान दर्ज करें, और असहमति सुलझाएँ, सब एक ही साझा रिकॉर्ड पर।',
    'gw.c1.t': 'Hire a helper', 'gw.c1.d': 'श्रेणी देखें, काम पर रखने का अनुरोध भेजें, या मौजूदा व्यवस्था दर्ज करें।', 'gw.c1.go': 'अनुरोध खोलें →',
    'gw.c2.t': 'Register as a helper', 'gw.c2.d': 'अपने हुनर, अनुभव और दर के साथ प्रोफ़ाइल बनाएँ ताकि परिवार आपको खोज सकें।', 'gw.c2.go': 'प्रोफ़ाइल बनाएँ →',
    'gw.c3.t': 'Shared ledger', 'gw.c3.d': 'हाज़िरी, पेशगी और भुगतान दर्ज करें। हर प्रविष्टि को सहायक सही है या गलत है करता है।', 'gw.c3.go': 'खाता खोलें →',
    'gw.c4.t': 'Helper directory', 'gw.c4.d': 'पंजीकृत सहायकों को खोजें और हर प्रोफ़ाइल का साफ़ भरोसा-स्कोर देखें।', 'gw.c4.go': 'सहायक देखें →',
    'gw.c5.t': 'Help and feedback', 'gw.c5.d': 'टिकट भेजें, सुझाव दें, या सत्यापन की समस्या बताएँ।', 'gw.c5.go': 'संपर्क करें →',
    'gw.regCta': 'सहायक के रूप में पंजीकरण', 'gw.hireCta': 'सहायक को काम पर रखें',

    /* register-worker */
    'reg.eyebrow': 'सहायक पंजीकरण', 'reg.title': 'सहायक के रूप में पंजीकरण करें',
    'reg.lead': 'अपने हुनर, अनुभव और दर के साथ प्रोफ़ाइल बनाएँ। परिवार आपको सूची में खोज सकेंगे और काम व भुगतान साझा खाते में दर्ज कर सकेंगे।',
    'reg.formTitle': 'अपनी सेवाखाता प्रोफ़ाइल बनाएँ', 'reg.formSub': '* वाले खाने ज़रूरी हैं। लिखते समय ही गलतियाँ दिख जाएँगी।',
    'reg.name': 'पूरा नाम', 'reg.name.ph': 'जैसे: सुनीता शर्मा', 'reg.phone': 'मोबाइल नंबर', 'reg.phone.ph': '10 अंकों का मोबाइल नंबर', 'reg.phone.hint': '6, 7, 8 या 9 से शुरू होना चाहिए।',
    'reg.email': 'ईमेल', 'reg.category': 'काम का प्रकार', 'reg.skills': 'हुनर', 'reg.skills.ph': 'खाना बनाना, सफ़ाई, बुज़ुर्गों की देखभाल', 'reg.skills.hint': 'हुनर कॉमा (,) से अलग करें।',
    'reg.exp': 'अनुभव (वर्ष)', 'reg.location': 'इलाका / मोहल्ला', 'reg.location.ph': 'जैसे: सेक्टर 49, गुरुग्राम', 'reg.rateType': 'दर का प्रकार',
    'reg.rate': 'दर (₹)', 'reg.rate.hint': 'रोज़ाना: ₹100–5,000 · मासिक: ₹1,000–1,00,000', 'reg.idType': 'पहचान पत्र का प्रकार', 'reg.idNumber': 'पहचान पत्र संख्या',
    'reg.idNumber.ph': 'पहचान पत्र संख्या लिखें', 'reg.idNumber.hint': 'सिर्फ़ फ़ॉर्मेट जाँचा जाता है। सेवाखाता केवल आख़िरी 4 अक्षर रखता है।',
    'reg.about': 'आपके काम के बारे में', 'reg.consent': 'मैं पुष्टि करता/करती हूँ कि ये जानकारी मेरी है और परिवार मेरी प्रोफ़ाइल सूची में देख सकते हैं।',
    'reg.submit': 'प्रोफ़ाइल बनाएँ', 'reg.howTitle': 'सत्यापन कैसे काम करता है', 'reg.howSub': 'नई प्रोफ़ाइल “सत्यापन बाकी” से शुरू होती है।',
    'reg.howBody': 'इस चरण में सत्यापन केवल डेटा में एक निशान है, असली सरकारी जाँच नहीं। आपकी पहचान संख्या सिर्फ़ फ़ॉर्मेट के लिए जाँची जाती है। केवल आख़िरी 4 अक्षर सहेजे जाते हैं, पूरी संख्या कभी नहीं।',
    'reg.demoNote': 'यह डेमो प्रोजेक्ट है: कृपया असली आधार नंबर न डालें। 234567890123 जैसा नमूना फ़ॉर्मेट जाँच पास कर लेता है।',
    'reg.recent': 'हाल में पंजीकृत', 'reg.openDirectory': 'सूची खोलें →',
    'reg.successTitle': 'प्रोफ़ाइल बन गई', 'reg.successLine': '{name}, आपकी प्रोफ़ाइल बन गई है। सत्यापन बाकी है।', 'reg.another': 'एक और पंजीकरण', 'reg.viewDir': 'सूची में देखें',
    'reg.noneYet': 'अभी कोई पंजीकरण नहीं।',

    /* hire-household */
    'hire.eyebrow': 'सहायक सेवाएँ', 'hire.title': 'सहायक को काम पर रखें',
    'hire.lead': 'रसोइया, घरेलू सहायिका, ड्राइवर या देखभालकर्ता खोजें, अनुरोध भेजें, या मौजूदा व्यवस्था दर्ज करें ताकि काम और भुगतान साथ में दर्ज हो सकें।',
    'hire.browseTitle': 'श्रेणी के अनुसार देखें', 'hire.browseSub': 'श्रेणी चुनें, मिलते-जुलते सहायक देखें, फिर नीचे अनुरोध भेजें।',
    'hire.formTitle': 'काम पर रखने का अनुरोध भेजें', 'hire.formSub': '* वाले खाने ज़रूरी हैं।', 'hire.kind': 'आप क्या करना चाहते हैं?',
    'hire.kindNew': 'नया सहायक चाहिए', 'hire.kindExisting': 'मौजूदा व्यवस्था दर्ज करें', 'hire.household': 'परिवार का नाम', 'hire.household.ph': 'जैसे: शर्मा परिवार',
    'hire.contact': 'संपर्क व्यक्ति', 'hire.contact.ph': 'आपका नाम', 'hire.phone': 'मोबाइल नंबर', 'hire.category': 'किस तरह की मदद चाहिए',
    'hire.worker': 'सहायक', 'hire.worker.hint': 'नए अनुरोध में वैकल्पिक। मौजूदा व्यवस्था दर्ज करते समय ज़रूरी।', 'hire.location': 'घर का इलाका',
    'hire.location.ph': 'जैसे: डीएलएफ फेज़ 3, गुरुग्राम', 'hire.start': 'शुरू होने की तारीख़', 'hire.schedule': 'दिन और समय', 'hire.schedule.ph': 'जैसे: सोम–शनि, सुबह 7–11',
    'hire.rate': 'प्रस्तावित वेतन (₹)', 'hire.rate.hint': 'सहायक से तय हुए अनुसार प्रति माह या प्रति दिन।', 'hire.notes': 'टिप्पणी', 'hire.submit': 'अनुरोध भेजें',
    'hire.recent': 'हाल के अनुरोध', 'hire.recentSub': 'सबसे नया ऊपर। यहाँ फ़ोन नंबर नहीं दिखाए जाते।', 'hire.toLedger': 'साझा खाता खोलें →',
    'hire.successTitle': 'अनुरोध भेज दिया गया', 'hire.successLine': '{house} का अनुरोध दर्ज हो गया है।', 'hire.helpersIn': '{cat} के सहायक', 'hire.noneIn': 'इस श्रेणी में अभी कोई सहायक नहीं।',
    'hire.noRequests': 'अभी कोई अनुरोध नहीं।', 'hire.existingTag': 'मौजूदा व्यवस्था', 'hire.newTag': 'नया अनुरोध', 'hire.pickWorker': 'कोई भी / बाद में तय करूँगा',

    /* ledger */
    'led.eyebrow': 'डिजिटल खाता', 'led.title': 'साझा खाता',
    'led.lead': 'हाज़िरी, भुगतान और पेशगी दर्ज करें। हर प्रविष्टि सहायक देखता है, और केवल स्वीकृत प्रविष्टियाँ ही आधिकारिक हिसाब में जाती हैं।',
    'led.viewAs': 'देखने का तरीका', 'led.asEmployer': 'नियोक्ता के रूप में', 'led.asHelper': 'सहायक के रूप में',
    'led.roleNoteEmployer': 'नियोक्ता प्रविष्टि दर्ज करता है। सहायक उसे सही है / गलत है करता है।', 'led.roleNoteHelper': 'आप सहायक के रूप में देख रहे हैं: विचाराधीन प्रविष्टि को सही है या गलत है चुनें।',
    'led.confirmedBalance': 'स्वीकृत शेष · साझा हिसाब', 'led.pending': 'विचाराधीन', 'led.disputed': 'विवादित',
    'led.formula': 'देय शेष = स्वीकृत काम + स्वीकृत बोनस − स्वीकृत भुगतान − स्वीकृत पेशगी। विचाराधीन और विवादित प्रविष्टियाँ अलग दिखती हैं और सहायक के स्वीकार करने तक कभी नहीं जुड़तीं।',
    'led.entries': 'खाते की प्रविष्टियाँ', 'led.search.ph': 'टिप्पणी या सहायक का नाम', 'led.worker': 'सहायक', 'led.status': 'स्थिति', 'led.type': 'प्रविष्टि का प्रकार',
    'led.addTitle': 'प्रविष्टि जोड़ें', 'led.addSub': 'नई प्रविष्टि सहायक के स्वीकार करने तक विचाराधीन रहती है।', 'led.kind': 'हाज़िरी', 'led.days': 'दिनों की संख्या',
    'led.date': 'तारीख़', 'led.amount': 'राशि (₹)', 'led.amount.hint': 'सहायक की दर से सुझाई गई। आप बदल सकते हैं।', 'led.note': 'टिप्पणी', 'led.note.ph': 'जैसे: पूरे दिन का घरेलू काम',
    'led.submit': 'खाते में जोड़ें', 'led.helperNote': 'आप सहायक के रूप में देख रहे हैं। प्रविष्टि जोड़ने के लिए “नियोक्ता के रूप में” चुनें।',
    'led.confirm': '✅ सही है', 'led.dispute': '⚠️ गलत है', 'led.resend': 'सुधारकर दोबारा भेजें', 'led.waiting': 'सहायक की स्वीकृति का इंतज़ार',
    'led.disputeTitle': 'यह प्रविष्टि गलत क्यों है?', 'led.disputeHint': 'छोटा कारण लिखें (कम से कम 10 अक्षर)। प्रविष्टि सुधरने तक हिसाब से बाहर रहेगी।', 'led.reason': 'कारण',
    'led.sendDispute': 'आपत्ति भेजें', 'led.cancel': 'रद्द करें', 'led.resendTitle': 'सुधारकर दोबारा भेजें', 'led.resendHint': 'सहायक ने लिखा: “{reason}”', 'led.newAmount': 'सुधारी हुई राशि (₹)',
    'led.sendAgain': 'दोबारा भेजें', 'led.confirmedToast': 'प्रविष्टि स्वीकृत हुई। अब यह हिसाब में जुड़ गई है।', 'led.disputedToast': 'आपत्ति दर्ज हुई। प्रविष्टि हिसाब से बाहर है।',
    'led.resentToast': 'प्रविष्टि दोबारा भेजी गई और विचाराधीन है।', 'led.addedToast': 'प्रविष्टि जुड़ गई और विचाराधीन है।', 'led.noEntries': 'इन फ़िल्टर से कोई प्रविष्टि नहीं मिली।',
    'led.count': '{n} प्रविष्टियाँ', 'led.confirmedNote': '{n} स्वीकृत प्रविष्टियाँ', 'led.pendingNote': '{n} प्रतीक्षा में · अभी हिसाब में नहीं', 'led.disputedNote': '{n} विवादित · हिसाब से बाहर',
    'led.allWorkers': 'सभी सहायक', 'led.allStatuses': 'सभी स्थितियाँ', 'led.allTypes': 'सभी प्रकार', 'led.chooseWorker': 'सहायक चुनें…', 'led.suggest': 'सुझाव: {calc}', 'led.reasonLabel': 'आपत्ति का कारण: {r}',
    'led.daysFor': '{n} दिन', 'led.by': 'दर्ज करने वाला: नियोक्ता', 'led.history': 'पहले {n} बार सुधारी गई',

    /* directory */
    'dir.eyebrow': 'सहायक सूची', 'dir.title': 'सहायक खोजें', 'dir.lead': 'पंजीकृत सहायकों को खोजें और छाँटें। हर प्रोफ़ाइल में साफ़ भरोसा-स्कोर है, जिसमें उनकी प्रविष्टियाँ कितनी बार स्वीकृत हुईं यह भी शामिल है।',
    'dir.search.ph': 'नाम, हुनर या इलाका', 'dir.category': 'काम का प्रकार', 'dir.minRating': 'न्यूनतम रेटिंग', 'dir.sort': 'क्रम', 'dir.verifiedOnly': 'केवल सत्यापित',
    'dir.trustTitle': 'भरोसा-स्कोर कैसे बनता है', 'dir.trustSub': 'चार दिखने वाले हिस्सों से 0–100 का स्कोर।',
    'dir.t1': '30 · पहचान जाँच का निशान', 'dir.t1d': 'प्रोफ़ाइल सत्यापित चिह्नित होने पर मिलता है।', 'dir.t2': '30 · रेटिंग', 'dir.t2d': '5 में से औसत रेटिंग, 30 अंकों में बदली हुई।',
    'dir.t3': '10 · अनुभव', 'dir.t3d': 'हर साल के अनुभव पर 1 अंक, अधिकतम 10।', 'dir.t4': '30 · रिकॉर्ड की विश्वसनीयता',
    'dir.t4d': 'देखी गई प्रविष्टियों में से कितनी सहायक ने स्वीकार कीं (विवादित नहीं)। जिनकी कोई प्रविष्टि नहीं देखी गई, उन्हें बीच का 15 अंक मिलता है।',
    'dir.demoNote': 'इस चरण में रेटिंग और सत्यापन केवल इंटरफ़ेस दिखाने के नमूना डेटा हैं। ये असली समीक्षाएँ या सरकारी जाँच नहीं हैं।',
    'dir.count': '{n} सहायक मिले', 'dir.none': 'इन फ़िल्टर से कोई सहायक नहीं मिला।', 'dir.anyRating': 'कोई भी रेटिंग', 'dir.rating4': '4 और ऊपर', 'dir.rating45': '4.5 और ऊपर',
    'dir.sortTrust': 'भरोसा-स्कोर', 'dir.sortRating': 'रेटिंग', 'dir.sortExp': 'अनुभव', 'dir.sortRate': 'दर (कम से ज़्यादा)', 'dir.allCats': 'सभी प्रकार', 'dir.trust': 'भरोसा-स्कोर',
    'dir.experience': 'अनुभव', 'dir.area': 'इलाका', 'dir.rate': 'दर', 'dir.reviewedLine': '{c} स्वीकृत · {d} विवादित', 'dir.noReviewed': 'अभी कोई प्रविष्टि देखी नहीं गई', 'dir.notRated': 'अभी रेटिंग नहीं',
    'dir.hireBtn': 'काम पर रखें', 'dir.ledgerBtn': 'खाता देखें', 'dir.tier.high': 'बहुत भरोसेमंद', 'dir.tier.good': 'अच्छा', 'dir.tier.building': 'बन रहा है', 'dir.tier.new': 'नया',
    'dir.breakdown': 'सत्यापन {v} · रेटिंग {r} · अनुभव {e} · रिकॉर्ड {c}',

    /* support */
    'sup.eyebrow': 'सहायता और सुझाव', 'sup.title': 'सहायता और सुझाव', 'sup.lead': 'सहायता टिकट भेजें, सेवाखाता के बारे में सुझाव दें, या प्रोफ़ाइल सत्यापन की समस्या बताएँ।',
    'sup.formTitle': 'हमें लिखें', 'sup.formSub': 'आपका संदेश प्रोजेक्ट की फ़ीडबैक फ़ाइल में रखा जाता है। * वाले खाने ज़रूरी हैं।', 'sup.kind': 'यह किस बारे में है?',
    'sup.kindSupport': 'सहायता टिकट', 'sup.kindFeedback': 'सुझाव', 'sup.kindVerification': 'सत्यापन की समस्या', 'sup.name': 'आपका नाम', 'sup.email': 'ईमेल', 'sup.phone': 'मोबाइल नंबर',
    'sup.related': 'कौन-सी प्रोफ़ाइल?', 'sup.subject': 'विषय', 'sup.subject.ph': 'संक्षेप में लिखें', 'sup.rating': 'आपकी रेटिंग', 'sup.message': 'संदेश', 'sup.message.ph': 'क्या हुआ बताइए (कम से कम 20 अक्षर)',
    'sup.submit': 'संदेश भेजें', 'sup.disputeTitle': 'किसी प्रविष्टि से असहमत हैं?', 'sup.disputeSub': 'इसके लिए टिकट की ज़रूरत नहीं।',
    'sup.disputeBody': 'साझा खाता खोलें और प्रविष्टि पर छोटे कारण के साथ “गलत है” चुनें। नियोक्ता के सुधारकर दोबारा भेजने तक वह हिसाब से बाहर रहती है। टिकट तभी भेजें जब मामला सुलझा न हो।',
    'sup.toLedger': 'खाते पर जाएँ →', 'sup.recent': 'हाल के संदेश', 'sup.recentSub': 'केवल विषय दिखता है। आपकी संपर्क जानकारी निजी रहती है।',
    'sup.successTitle': 'संदेश भेज दिया गया', 'sup.successLine': 'धन्यवाद, {name}। आपका संदेश दर्ज हो गया है।', 'sup.noneYet': 'अभी कोई संदेश नहीं।', 'sup.anyProfile': 'कोई विशेष प्रोफ़ाइल नहीं'
  };

  const I = { lang: 'en', EN, HI };

  try { const saved = localStorage.getItem('sk_lang'); if (saved === 'hi' || saved === 'en') I.lang = saved; } catch (e) { /* storage blocked */ }

  I.t = function (key, fallback) {
    if (I.lang === 'hi' && HI[key] !== undefined) return HI[key];
    return EN[key] !== undefined ? EN[key] : (fallback !== undefined ? fallback : key);
  };

  /** Translate a validation error object { key, en, params }. */
  I.msg = function (err) {
    if (!err) return '';
    const base = I.lang === 'hi' && HI[err.key] ? HI[err.key] : (err.en || EN[err.key] || err.key);
    return err.params ? base.replace('{n}', err.params.n) : base;
  };

  I.fmt = function (key, vars, fallback) {
    let s = I.t(key, fallback);
    Object.keys(vars || {}).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  };

  function apply() {
    document.documentElement.lang = I.lang === 'hi' ? 'hi' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.dataset.i18nEn === undefined) el.dataset.i18nEn = el.textContent.trim();
      const key = el.dataset.i18n;
      el.textContent = I.lang === 'hi' && HI[key] !== undefined ? HI[key] : el.dataset.i18nEn;
    });
    [['data-i18n-placeholder', 'placeholder', 'i18nPhEn'], ['data-i18n-aria', 'aria-label', 'i18nAriaEn']].forEach(([attr, target, store]) => {
      document.querySelectorAll('[' + attr + ']').forEach((el) => {
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(target) || '';
        const key = el.getAttribute(attr);
        el.setAttribute(target, I.lang === 'hi' && HI[key] !== undefined ? HI[key] : el.dataset[store]);
      });
    });
    document.querySelectorAll('.lang-toggle [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === I.lang)));
    document.dispatchEvent(new CustomEvent('sk:langchange', { detail: { lang: I.lang } }));
  }

  I.set = function (lang) {
    I.lang = lang === 'hi' ? 'hi' : 'en';
    try { localStorage.setItem('sk_lang', I.lang); } catch (e) { /* ignore */ }
    apply();
  };

  I.init = function () {
    const qLang = (typeof location !== 'undefined') ? new URLSearchParams(location.search).get('lang') : null;
    if (qLang === 'hi' || qLang === 'en') I.lang = qLang;
    document.querySelectorAll('.lang-toggle [data-lang]').forEach((b) => b.addEventListener('click', () => I.set(b.dataset.lang)));
    apply();
  };

  window.SKI18N = I;
})();
