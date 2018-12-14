/*
This script offers functionalities to modify portfolio objects.
 */

function addStockToPortfolio(stock, portfolio) {
    if (isStockAddable(stock, portfolio)) {
        portfolio.stocks.push(stock);
        return true;
    }

    return false;
}

function isStockAddable(stock, portfolio) {
    return (isStockValid(stock) && !isStockInPortfolio(stock, portfolio));
}

function isStockValid(stock) {
    const name = stock.name;
    const quantity = stock.quantity;

    return (name !== "" && !isNaN(quantity) && quantity > 0);
}

function isStockInPortfolio(stock, portfolio) {
    const name = stock.name;
    const stocks = portfolio.stocks;

    for (var i = 0; i < stocks.length; i++) {
        if (stocks[i].name == name)
            return true;
    }

    return false;
}

function removeStocksFromPortfolio(stocks, portfolio) {
    for (var i = 0; i < stocks.length; i++) {
        removeStockFromPortfolio(stocks[i], portfolio);
    }
}

function removeStockFromPortfolio(stock, portfolio) {
    if (isStockValid(stock)) {
        const index = portfolio.stocks.indexOf(stock);
        portfolio.stocks.splice(index, 1);
    }
}

function switchCurrencyInPortfolio(portfolio) {
    if (portfolio.currency === "eur") {
        setCurrencyInPortfolio("usd", portfolio);
    } else if (portfolio.currency === "usd") {
        setCurrencyInPortfolio("eur", portfolio);
    }
}

function setCurrencyInPortfolio(currency, portfolio) {
    portfolio.currency = currency;
}