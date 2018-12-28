/*
This script offers functionalities to modify portfolio objects.
 */

/*
Add a stock to a portfolio if possible and return if it was successful.
 */
function addStockToPortfolio(stock, portfolio) {
    if (isStockAddable(stock, portfolio)) {
        portfolio.stocks.push(stock);
        return true;
    }
    return false;
}

/*
Check if a stock can be added to a portfolio.
 */
function isStockAddable(stock, portfolio) {
    // A valid stock can be added to a portfolio that does not already contain that stock.
    return (isStockValid(stock) && !isStockInPortfolio(stock, portfolio));
}

/*
Check if a stock is valid.
 */
function isStockValid(stock) {
    const name = stock.name;
    const quantity = stock.quantity;

    // Stock has to have a name and a positive quantity.
    return (name !== "" && !isNaN(quantity) && quantity > 0);
}

/*
Check if a stock is already in a portfolio.
 */
function isStockInPortfolio(stock, portfolio) {
    const name = stock.name;
    const stocks = portfolio.stocks;

    for (var i = 0; i < stocks.length; i++) {
        if (stocks[i].name == name)
            return true;
    }
    return false;
}

/*
Remove a list of stocks from a portfolio.
 */
function removeStocksFromPortfolio(stocks, portfolio) {
    for (var i = 0; i < stocks.length; i++) {
        removeStockFromPortfolio(stocks[i], portfolio);
    }
}

/*
Remove one stock from a portfolio.
 */
function removeStockFromPortfolio(stock, portfolio) {
    if (isStockValid(stock)) {
        const index = portfolio.stocks.indexOf(stock);
        portfolio.stocks.splice(index, 1);
    }
}

/*
Switch the currency of a portfolio.
 */
function switchCurrencyInPortfolio(portfolio) {
    if (portfolio.currency === "eur") {
        setCurrencyInPortfolio("usd", portfolio);
    } else if (portfolio.currency === "usd") {
        setCurrencyInPortfolio("eur", portfolio);
    }
}

/*
Set the currency of a portfolio to a specific currency.
 */
function setCurrencyInPortfolio(currency, portfolio) {
    portfolio.currency = currency;
}

/*
Check if a list of portfolios already contain a portfolio with the same name.
 */
function isPortfolioAddable(portfolio, portfolios) {
    const name = portfolio.name;
    for (let i = 0; i < portfolios.length; i++) {
        if (portfolios[i].name === name) {
            return false;
        }
    }
    return true;
}