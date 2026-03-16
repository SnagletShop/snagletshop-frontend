(function (window) {
  'use strict';
  const TEXTS = {
    ERRORS: {
      BASKET_PARSE: '❌ Failed to parse basket from localStorage. Resetting basket.',
      GEOLOCATION_FAIL: 'Geolocation failed, defaulting to EUR',
      PRODUCTS_NOT_LOADED: 'Products data not loaded. Check your script order.',
      PRODUCTS_LOADED: 'Products data loaded.'
    },
    GENERAL: { TOTAL_LABEL: 'Total: ', DARK_MODE_LABEL: 'Dark Mode' },
    CURRENCIES: { EUR: '€', USD: '$', GBP: '£', CAD: 'C$', AUD: 'A$' },
    PAYMENT_MODAL: {
      TITLE: 'Enter Payment Details',
      FIELDS: {
        NAME: 'First Name', SURNAME: 'Last Name', EMAIL: 'Email Address', CITY: 'City / Town', POSTAL_CODE: 'Postal Code',
        STREET_HOUSE_NUMBER: 'Street and House Number', COUNTRY: 'Country of Residence', CARD_HOLDER_NAME_LABEL: 'Cardholder Name',
        CARD_HOLDER_NAME_PLACEHOLDER: 'Cardholder Name', CARD_NUMBER_LABEL: 'Card Number', CARD_NUMBER_PLACEHOLDER: 'xxxx xxxx xxxx xxxx',
        EXPIRY_DATE_LABEL: 'Card Expiry Date', EXPIRY_DATE_PLACEHOLDER: 'MM/YY', CVV_LABEL: 'CVV', CVV_PLACEHOLDER: 'CVV'
      },
      BUTTONS: { SUBMIT: 'Pay Now', CLOSE: '×' }
    },
    CONTACT_FORM: { TITLE: 'Send us a Message!', FIELDS: { EMAIL: 'Your Email', MESSAGE: 'Message' }, SEND_BUTTON: 'Send!' },
    SORTING: { LABEL: 'Sort by:', OPTIONS: { NAME_ASC: 'Name (A-Z)', NAME_DESC: 'Name (Z-A)', PRICE_ASC: 'Price (Low to High)', PRICE_DESC: 'Price (High to Low)' } },
    PRODUCT_SECTION: { ADD_TO_CART: 'Add to Cart', BUY_NOW: 'Buy', PRICE_LABEL: 'Price: ', DESCRIPTION_PLACEHOLDER: 'No description available.', IMAGE_NAV: { PREVIOUS: '◀', NEXT: '▶' } },
    SEARCH: { PLACEHOLDER: 'Search', EMPTY_MESSAGE: 'Please enter a search term.', NO_RESULTS: 'No products found.' },
    BASKET: { EMPTY_MESSAGE: 'The basket is empty.', TOTAL_PRICE: 'Total Price: ', QUANTITY: 'Quantity:', BUTTONS: { DECREASE: '−', INCREASE: '+', PAY_NOW: 'Pay Now' }, RECEIPT_TITLE: 'Receipt' }
  };
  const countryToCurrency = {
    US:'USD', CA:'CAD', MX:'MXN', JM:'JMD', DO:'DOP', GB:'GBP', FR:'EUR', DE:'EUR', IT:'EUR', ES:'EUR', NL:'EUR', BE:'EUR',
    PL:'PLN', CZ:'CZK', SE:'SEK', NO:'NOK', DK:'DKK', HU:'HUF', RO:'RON', BG:'BGN', RU:'RUB', UA:'UAH',
    SK:'EUR', SI:'EUR', PT:'EUR', FI:'EUR', IE:'EUR', AT:'EUR', GR:'EUR', EE:'EUR', LV:'EUR', LT:'EUR',
    JP:'JPY', CN:'CNY', IN:'INR', KR:'KRW', ID:'IDR', MY:'MYR', PH:'PHP', TH:'THB', VN:'VND', PK:'PKR', BD:'BDT',
    ZA:'ZAR', NG:'NGN', KE:'KES', EG:'EGP', GH:'GHS', TZ:'TZS', AU:'AUD', NZ:'NZD', FJ:'FJD', PG:'PGK',
    AE:'AED', SA:'SAR', IL:'ILS', TR:'TRY', IR:'IRR', BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN', VE:'VES'
  };
  const countryNames = {
    US:'United States', CA:'Canada', MX:'Mexico', JM:'Jamaica', DO:'Dominican Republic', GB:'United Kingdom', FR:'France', DE:'Germany', IT:'Italy', ES:'Spain', NL:'Netherlands', BE:'Belgium',
    PL:'Poland', CZ:'Czechia', SE:'Sweden', NO:'Norway', DK:'Denmark', HU:'Hungary', RO:'Romania', BG:'Bulgaria', RU:'Russia', UA:'Ukraine',
    SK:'Slovakia', SI:'Slovenia', PT:'Portugal', FI:'Finland', IE:'Ireland', AT:'Austria', GR:'Greece', EE:'Estonia', LV:'Latvia', LT:'Lithuania',
    JP:'Japan', CN:'China', IN:'India', KR:'South Korea', ID:'Indonesia', MY:'Malaysia', PH:'Philippines', TH:'Thailand', VN:'Vietnam', PK:'Pakistan', BD:'Bangladesh',
    ZA:'South Africa', NG:'Nigeria', KE:'Kenya', EG:'Egypt', GH:'Ghana', TZ:'Tanzania', AU:'Australia', NZ:'New Zealand', FJ:'Fiji', PG:'Papua New Guinea',
    AE:'United Arab Emirates', SA:'Saudi Arabia', IL:'Israel', TR:'Turkey', IR:'Iran', BR:'Brazil', AR:'Argentina', CL:'Chile', CO:'Colombia', PE:'Peru', VE:'Venezuela',
    AF:'Afghanistan', AL:'Albania', DZ:'Algeria', AD:'Andorra', AO:'Angola', AG:'Antigua and Barbuda', AM:'Armenia', AZ:'Azerbaijan', BS:'Bahamas', BH:'Bahrain', BB:'Barbados', BY:'Belarus',
    BZ:'Belize', BJ:'Benin', BT:'Bhutan', BO:'Bolivia', BA:'Bosnia and Herzegovina', BW:'Botswana', BN:'Brunei', BF:'Burkina Faso', BI:'Burundi', KH:'Cambodia', CM:'Cameroon', CV:'Cape Verde', CF:'Central African Republic', TD:'Chad', KM:'Comoros', CG:'Congo', CR:'Costa Rica', CI:'Côte d’Ivoire', HR:'Croatia', CU:'Cuba', CY:'Cyprus', DJ:'Djibouti', DM:'Dominica', EC:'Ecuador', SV:'El Salvador', GQ:'Equatorial Guinea', ER:'Eritrea', SZ:'Eswatini', ET:'Ethiopia', GA:'Gabon', GM:'Gambia', GE:'Georgia', GD:'Grenada', GT:'Guatemala', GN:'Guinea', GW:'Guinea-Bissau', GY:'Guyana', HT:'Haiti', HN:'Honduras', IS:'Iceland', IQ:'Iraq', JO:'Jordan', KZ:'Kazakhstan', KI:'Kiribati', XK:'Kosovo', KW:'Kuwait', KG:'Kyrgyzstan', LA:'Laos', LB:'Lebanon', LS:'Lesotho', LR:'Liberia', LY:'Libya', LI:'Liechtenstein', LU:'Luxembourg', MG:'Madagascar', MW:'Malawi', MV:'Maldives', ML:'Mali', MT:'Malta', MH:'Marshall Islands', MR:'Mauritania', MU:'Mauritius', FM:'Micronesia', MD:'Moldova', MC:'Monaco', MN:'Mongolia', ME:'Montenegro', MA:'Morocco', MZ:'Mozambique', MM:'Myanmar', NA:'Namibia', NR:'Nauru', NP:'Nepal', NI:'Nicaragua', NE:'Niger', MK:'North Macedonia', OM:'Oman', PW:'Palau', PA:'Panama', PY:'Paraguay', QA:'Qatar', RW:'Rwanda', KN:'Saint Kitts and Nevis', LC:'Saint Lucia', VC:'Saint Vincent and the Grenadines', WS:'Samoa', SM:'San Marino', ST:'Sao Tome and Principe', SN:'Senegal', RS:'Serbia', SC:'Seychelles', SL:'Sierra Leone', SG:'Singapore', SB:'Solomon Islands', SO:'Somalia', SS:'South Sudan', LK:'Sri Lanka', SD:'Sudan', SR:'Suriname', CH:'Switzerland', SY:'Syria', TJ:'Tajikistan', TL:'Timor-Leste', TG:'Togo', TO:'Tonga', TT:'Trinidad and Tobago', TN:'Tunisia', TM:'Turkmenistan', TV:'Tuvalu', UG:'Uganda', UY:'Uruguay', UZ:'Uzbekistan', VU:'Vanuatu', VA:'Vatican City', YE:'Yemen', ZM:'Zambia', ZW:'Zimbabwe'
  };
  window.__SS_SHARED_DATA__ = { TEXTS, countryToCurrency, countryNames };
})(window);
