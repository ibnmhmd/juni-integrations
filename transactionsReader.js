const fs = require('fs')
var path = require('path');
/** constant object to hold path and file names of the transactions */
const serverPaths = { 
                    root : 'transactionsRepo',
                    _b : { path : 'banks', record : 'transaction_revolut1'},
                    _p : { path : 'paypals', record: 'transaction_paypal', count : 4 }
                 };

var bankRepo = path.join(__dirname, '.', serverPaths.root , serverPaths._b.path, `${serverPaths._b.record}.json`);

/*** read bank transactions i.e : from Mongodb, Maria, MySQL ....etc */
const readBankTransactions = () => {
    let bankTransactions = [];
    try {
      let data = fs.readFileSync(bankRepo , 'utf8');
      if(data){
        data = JSON.parse(data);
      }
      bankTransactions.push(data);
    } catch (err) {
      console.error(err);
    }
    return  bankTransactions;
}
/*** read paypal transactions recursively i.e : from Mongodb, Maria, MySQL ....etc */
const readPaypalTransactions = () => {
  let paypalTransactions = [], paypalRepo = "", data = null, record = "";
  try {
    for(let count = 1; count <= serverPaths._p.count; count++){
      record = `${serverPaths._p.record}${count}.json`;
      paypalRepo = path.join(__dirname, '.',  serverPaths.root , serverPaths._p.path, record );
      data = fs.readFileSync(paypalRepo , 'utf8');
      if(data){
        data = JSON.parse(data);
      }
      paypalTransactions.push(data);
    }
  } catch (err) {
    console.error(err);
  }
  return  paypalTransactions;
}
const fetchAndProcessTransactions = ()=> {
  let banksTransactions = readBankTransactions();
  let paypals = readPaypalTransactions();
  /** loop all bank records that were returned and get their subsequent paypal transactions*/
  for(let i=0; i < banksTransactions.length; i++ ){
    banksTransactions[i].paypals =[];
    const bankTransactionTimestamp = banksTransactions[i].created_at ?  new Date (banksTransactions[i].created_at) : new Date();
    /*** get all paypal transactions that happened immediately after the bank transaction */
    paypals = paypals.filter ((record) => new Date (record.created_at) > bankTransactionTimestamp);
    /** since the transaction was in GBP currency and The card is in turn connected to
     * our EUR Paypal account, means there're are couple of currency conversions happen 
     * therefore, we need to group all paypal transactions according to the currency type 
     * and sort each group by the record creation id (which transaction was first)
     * **/
    let currencies = [], obj = {};
    const distinctCurrencies  = [...new Set( paypals.map( paypal  => paypal.currency_code)) ];
    for(let j=0 ; j < distinctCurrencies.length; j++){
      obj = {} , obj.currency = {};
      obj.currency.type = distinctCurrencies[j];
      obj.currency['data'] =  paypals.filter((_p) => distinctCurrencies[j] === _p.currency_code)
                              .sort((a , b) => { 
                                return parseInt(a.id) - parseInt(b.id)
                              });
      currencies.push(obj);
    }
    /** link the paypal transactions, EUR and GBP to the main bank transaction respectively **/
    currencies.map((curr , idx) => {
      if(curr.currency.data){
        curr.currency.data.map((inner, ix) => {
          banksTransactions[i].paypals.push(inner);
        });
      }
    })
  }
   return banksTransactions;
}
module.exports = { fetchAndProcessTransactions }