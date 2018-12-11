/*
This script offers all funcionalities needed for the React App to interact with and persist the local storage.
 */

function setPortfolioInStorage(portfolio) {
    const name = portfolio.name;
    var portfolios = getPortfoliosFromStorage();
    var updated = false;

    // Look for existing equivalent portfolio in local storage.
    for (var i = 0; i < portfolios.length; i++) {
        if (portfolios[i].name === name) {
            // Update existing portfolio in local storage.
            portfolios[i] = portfolio;
            setPortfoliosInStorage(portfolios);
            updated = true;
        }
    }

    if (!updated) {
        // Add new portfolio.
        portfolios.push(portfolio);
        setPortfoliosInStorage(portfolios);
    }

    return portfolios;
}

function deletePortfolioInStorage(portfolio) {
    const name = portfolio.name;
    var portfolios = getPortfoliosFromStorage();

    for (var i = 0; i < portfolios.length; i++) {
        if (portfolios[i].name === name) {
            // Delete existing portfolio in local storage.
            portfolios.splice(i, 1);
            break;
        }
    }

    setPortfoliosInStorage(portfolios);
    return portfolios;
}

function getPortfoliosFromStorage() {
    var portfolios = localStorage.getItem("portfolios");
    return JSON.parse(portfolios);
}

function setPortfoliosInStorage(portfolios) {
    portfolios = JSON.stringify(portfolios);
    localStorage.setItem("portfolios", portfolios);
}