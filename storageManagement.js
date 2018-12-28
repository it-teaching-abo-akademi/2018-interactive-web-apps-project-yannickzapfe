/*
This script offers all funcionalities needed for the React App to interact with and persist the local storage.
 */

/*
Add or update a specific portfolio in the local storage.
 */
function setPortfolioInStorage(portfolio) {
    const name = portfolio.name;
    let portfolios = getPortfoliosFromStorage();
    let updated = false;

    /* Look for existing equivalent portfolio in local storage. */
    for (let i = 0; i < portfolios.length; i++) {
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

    // Return the new list of portfolios in the storage.
    return portfolios;
}

/*
Delete a specific portfolio in the local storage.
 */
function deletePortfolioInStorage(portfolio) {
    const name = portfolio.name;
    let portfolios = getPortfoliosFromStorage();

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

/*
Get and parse the portfolios from the local storage.
 */
function getPortfoliosFromStorage() {
    let portfolios = localStorage.getItem("portfolios");
    return JSON.parse(portfolios);
}

/*
Set and encode a specific list of portfolios in the local storage.
 */
function setPortfoliosInStorage(portfolios) {
    portfolios = JSON.stringify(portfolios);
    localStorage.setItem("portfolios", portfolios);
}