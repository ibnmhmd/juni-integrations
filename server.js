const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const Executors = require('./transactionsReader');
// console.log that your server is up and running
app.listen(port, () => console.log(`Your JUNI server is up and listening on port ${port}`));

// create a GET route
const getTransactions = async ()=> {
  const resp = await new Promise( (resolve , reject) => {
    setTimeout(() => {
      const transactions = Executors.fetchAndProcessTransactions();
      resolve({ transactions });
    }, 4000);
  } );
  return resp;
}
app.get('/fetchTransactions', async (req, res) => {
  const resp = await getTransactions();
  res.send({ response :  resp });
});


