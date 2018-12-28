/*
This script creates the single page application using the React framework.
 */

// Key for the Alphavantage API.
const apiKey = "6RV3I3M11BQK941F";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.onPortfolioAdd = this.onPortfolioAdd.bind(this);
        this.onPortfolioDelete = this.onPortfolioDelete.bind(this);
        this.onPortfolioUpdate = this.onPortfolioUpdate.bind(this);
        this.createPopup = this.createPopup.bind(this);
        this.closePopup = this.closePopup.bind(this);

        this.state = {
            portfolios: getPortfoliosFromStorage(),
            exchangeRate: 1,
            popup: null,
        };

        // Set exchange rate globally for the app on page load.
        this.setExchangeRate();
    }

    render() {
        // Create representations of portfolios.
        const portfolios = this.state.portfolios;
        const boxes = portfolios.map((portfolio) =>
            <Portfolio
                key={portfolio.name}
                portfolio={portfolio}
                exchangeRate={this.state.exchangeRate}
                onAdd={this.onPortfolioAdd}
                onDelete={this.onPortfolioDelete}
                onUpdate={this.onPortfolioUpdate}
                onShowGraph={this.createPopup}
            />
        );

        const empty = {};
        const popup = this.state.popup;

        return (
            <div>
                <Header />

                {boxes}

                {portfolios.length < 10 ?
                    <Portfolio
                        key="empty"
                        portfolio={empty}
                        onAdd={this.onPortfolioAdd}
                        onDelete={this.onPortfolioDelete}
                        onUpdate={this.onPortfolioUpdate}
                        onShowGraph={this.createPopup}
                    /> :
                    <div />}

                {popup ?
                    <GraphPopup
                        portfolio={this.state.popup}
                        close={this.closePopup}
                    /> :
                    <div />}
            </div>
        );
    }

    /*
    Overwrite updated portfolio in storage.
     */
    onPortfolioUpdate(portfolio) {
        const portfolios = setPortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});
    }

    /*
    Add new portfolio to storage.
     */
    onPortfolioAdd(portfolio) {
        // Check if the portfolio name already exists.
        if (isPortfolioAddable(portfolio, this.state.portfolios)) {
            const portfolios = setPortfolioInStorage(portfolio);
            this.setState({portfolios: portfolios});
            return true;
        }
        return false;
    }

    /*
    Delete portfolio in storage.
     */
    onPortfolioDelete(portfolio) {
        const portfolios = deletePortfolioInStorage(portfolio);
        this.setState({portfolios: portfolios});
    }

    /*
    Fetch and set global exchange rate.
     */
    setExchangeRate() {
        const method = "GET";
        const url = "https://www.alphavantage.co/query?" +
            "function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=" + apiKey;
        const dataType = "json";

        // Fetch current exchange rate from API.
        $.ajax({
            method: method,
            url: url,
            dataType: dataType,
            success: this.setExchangeRateFromData.bind(this)
        });
    }

    /*
    Set global exchange rate from API data.
     */
    setExchangeRateFromData(data) {
        // Catch notes in case of overusing API.
        if (data["Note"])
            return;

        const exchangeRate = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
        this.setState({exchangeRate: exchangeRate});
    }

    /*
    Set up the graph popup for rendering.
     */
    createPopup(portfolio, selected) {
        this.setState(currentState => {
            currentState.popup = portfolio;
            return currentState;
        })
    }

    /*
    Reset and remove popup.
     */
    closePopup() {
        this.createPopup(null, []);
    }
}

class Header extends React.Component {
    render() {
        return (
            <div className="header">
                Stock Portfolio Management
            </div>
        );
    }
}

/*
Abstract portfolio class that is either a filled or an empty portfolio.
 */
class Portfolio extends React.Component {
    render() {
        const portfolio = this.props.portfolio;

        if (isEmpty(portfolio)) {
            return <EmptyPortfolio onAdd={this.props.onAdd}/>;
        } else {
            return (
                <FilledPortfolio
                    portfolio={portfolio}
                    exchangeRate={this.props.exchangeRate}
                    onDelete={this.props.onDelete}
                    onUpdate={this.props.onUpdate}
                    onShowGraph={this.props.onShowGraph}
                />
            );
        }
    }
}

class FilledPortfolio extends React.Component {
    constructor(props) {
        super(props);

        this.onSumChange = this.onSumChange.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onAddSubmit = this.onAddSubmit.bind(this);
        this.onStockSelect = this.onStockSelect.bind(this);
        this.onStockRemove = this.onStockRemove.bind(this);
        this.onCurrencySwitch = this.onCurrencySwitch.bind(this);
        this.onShowGraph = this.onShowGraph.bind(this);

        this.state = {
            sum: 0,
            newEntry: {symbol: "", quantity: ""},
            selected: []
        };
    }

    render() {
        const portfolio = this.props.portfolio;
        const name = portfolio.name;
        const stocks = portfolio.stocks;

        const currency = portfolio.currency;
        const exchangeRate = this.props.exchangeRate;

        // Calculate sum from currency and exchange rate.
        let sum = this.state.sum;
        if (currency === "eur") {
            sum *= exchangeRate;
        }

        const iconStyle = {fontSize: "40px"};

        return (
            <div className="col-6">
                <div className="portfolio">
                    <h1>{name}</h1>
                    <i
                        className="fa fa-times-circle closeIcon"
                        onClick={this.onDelete}
                        style={iconStyle}
                    />

                    <StockTable
                        stocks={stocks}
                        currency={currency}
                        exchangeRate={this.props.exchangeRate}
                        onSumChange={this.onSumChange}
                        onUpdate={this.onUpdate}
                        newEntry={this.state.newEntry}
                        onRowSelect={this.onStockSelect}
                        selectedStocks={this.state.selected}
                    />

                    <SumLine sum={sum} currency={currency} />
                    <SubmitLine
                        onAdd={this.onAddSubmit}
                        onRemove={this.onStockRemove}
                        onCurrencySwitch={this.onCurrencySwitch}
                        currency={currency}
                        onShowGraph={this.onShowGraph}
                    />
                </div>
            </div>
        );
    }

    /*
    Update the sum (on adding or deleting a stock).
     */
    onSumChange(price) {
        this.setState(currentState => {
            currentState.sum += price;
            return currentState;
        });
    }

    /*
    Delete this portfolio.
     */
    onDelete() {
        const portfolio = this.props.portfolio;

        // Pass the portfolio to the app.
        this.props.onDelete(portfolio);
    }

    /*
    Update the next entry on input change.
     */
    onUpdate(newEntry) {
        // Pass the values of the possible new stock table entry to the state.
        this.setState({newEntry: newEntry});
    }

    /*
    Add new stock table entry on submit.
     */
    onAddSubmit() {
        const portfolio = this.props.portfolio;
        let newEntry = this.state.newEntry;
        const symbol = newEntry.symbol;
        const quantity = parseInt(newEntry.quantity);
        newEntry = {name: symbol, quantity: quantity};

        // Try to add the new stock to the portfolio.
        let stockIsValid = addStockToPortfolio(newEntry, portfolio);
        if (stockIsValid) {
            // Clear new entry in state to create a new empty line.
            this.setState({newEntry: {symbol: "", quantity: 0}});
            this.props.onUpdate(portfolio);
        }
    }

    /*
    Add or remove the selected or deselected stock to or from the list of selected stocks.
     */
    onStockSelect(stock) {
        this.setState(currentState => {
            // Check if the stock is already selected.
            const index = currentState.selected.indexOf(stock);
            if (index < 0) {
                currentState.selected.push(stock);
            } else if (index >= 0) {
                // Remove stock from selected list.
                currentState.selected.splice(index, 1);
            }
            return currentState;
        });
    }

    /*
    Remove selected stocks from the portfolio.
     */
    onStockRemove() {
        var portfolio = this.props.portfolio;

        removeStocksFromPortfolio(this.state.selected, portfolio);
        this.setState({selected: []});
        this.props.onUpdate(portfolio);
    }

    /*
    Switch currency.
     */
    onCurrencySwitch() {
        let portfolio = this.props.portfolio;
        switchCurrencyInPortfolio(portfolio);
        this.props.onUpdate(portfolio);
    }

    /*
    Show the graph for this portfolio.
     */
    onShowGraph() {
        // Pass this portfolio and the selected stocks to the app for it to show the graph.
        this.props.onShowGraph(this.props.portfolio, this.state.selected);
    }
}

class EmptyPortfolio extends React.Component {
    constructor(props) {
        super(props);

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleAdd = this.handleAdd.bind(this);

        this.state = {name: ""};
    }

    render() {
        const name = this.state.name;
        // No add button in case of empty input.
        let addButton = <div />;
        if (name !== "") {
            /* Add add button in case of input. */
            const iconStyle = {fontSize: "192px"};
            addButton = (
                <div className="addIconWrapper">
                    <i className="fa fa-plus-circle addIcon"
                       onClick={this.handleAdd}
                       style={iconStyle} />
                </div>
            )
        }

        return (
            <div className="col-6">
                <div className="newPortfolio">
                    <input
                        type="text"
                        value={name}
                        onChange={this.handleNameChange}
                        placeholder="New portfolio"
                    />
                    {addButton}
                </div>
            </div>
        );
    }

    /*
    Handle input change for the portfolio name.
     */
    handleNameChange(event) {
        const name = event.target.value;
        this.setState({name: name});
    }

    /*
    Handle creation of a new portfolio.
     */
    handleAdd() {
        const name = this.state.name;
        const portfolio = {
            name: name,
            currency: "eur",
            stocks: []
        };

        if (this.props.onAdd(portfolio)) {
            // Clear the input for the next portfolio if adding was successful.
            this.setState({name: ""});
        }
    }
}

class StockTable extends React.Component {
    render() {
        const stocks = this.props.stocks;
        // Create table rows for each stock.
        const rows = stocks.map((stock) =>
            <StockTableRow
                key={stock.name}
                stock={stock}
                currency={this.props.currency}
                exchangeRate={this.props.exchangeRate}
                addPrice={this.props.onSumChange}
                onSelect={this.props.onRowSelect}
                selected={this.props.selectedStocks.includes(stock)}
            />
        );

        const newEntry = this.props.newEntry;

        return (
            <div className="tableWrapper">
                <table>
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <th>Unit value</th>
                            <th>Quantity</th>
                            <th>Total value</th>
                            <th>Select</th>
                        </tr>
                        {rows}
                        {stocks.length < 50 ?
                            <EmptyStockTableRow
                                symbol={newEntry.symbol}
                                quantity={newEntry.quantity}
                                onUpdate={this.props.onUpdate}
                            /> :
                            <div />}
                    </tbody>
                </table>
            </div>
        );
    }
}

class StockTableRow extends React.Component {
    constructor(props) {
        super(props);

        this.setPrice = this.setPrice.bind(this);
        this.onSelect = this.onSelect.bind(this);

        this.state = {price: 0};
    }

    render() {
        const name = this.props.stock.name;
        const quantity = this.props.stock.quantity;

        let price = this.state.price;
        let total = quantity * price;
        let currency = this.props.currency;

        /* Calculate price and total value depending on currency. */
        if (currency === "eur") {
            const exchangeRate = this.props.exchangeRate;
            price = price * exchangeRate;
            total = total * exchangeRate;
        }

        /* Round prices for displaying. */
        price = currencyRound(price);
        total = currencyRound(total);

        currency = getCurrencySymbol(currency);

        /* Mark row if selected. */
        let rowStyle = {};
        if (this.props.selected)
            rowStyle = {backgroundColor: "#88a0c9"};

        return (
            <tr onClick={this.onSelect} style={rowStyle}>
                <td>{name}</td>
                <td>{price} {currency}</td>
                <td>{quantity}</td>
                <td>{total} {currency}</td>
                <td><input type="checkbox" checked={this.props.selected} /></td>
            </tr>
        );
    }

    componentDidMount() {
        const name = this.props.stock.name;
        const method = "GET",
            url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" + name + "&apikey=" + apiKey,
            dataType = "json";

        /* Fetch current price of the stock on mounting. */
        $.ajax({
            method: method,
            url: url,
            dataType: dataType,
            success: this.setPrice
        });
    }

    componentWillUnmount() {
        const price = this.state.price;
        const quantity = this.props.stock.quantity;
        const total = price * quantity;

        // Subtract the value of the stock from the sum on unmounting.
        this.props.addPrice(-total);
    }

    /*
    Set the current price of the stock from the fetched API data.
     */
    setPrice(data) {
        // Catch notes in case of overusing API.
        if (data["Note"])
            return;

        const quote = data["Global Quote"];

        // Catch invalid stock name.
        if (isEmpty(quote)) {
            alert("This symbol does not belong to a stock.")
            return;
        }

        const price = quote["05. price"];
        const quantity = this.props.stock.quantity;

        this.setState({price: price});
        this.props.addPrice(price * quantity);
    }

    /*
    Handle selection or deselection of this stock.
     */
    onSelect(event) {
        // Pass selected or deselected stock to portfolio.
        this.props.onSelect(this.props.stock);
    }
}

class EmptyStockTableRow extends React.Component {
    constructor(props) {
        super(props);

        this.onSymbolChange = this.onSymbolChange.bind(this);
        this.onQuantityChange = this.onQuantityChange.bind(this);
    }

    render() {
        const symbol = this.props.symbol;
        const quantity = this.props.quantity;

        return (
            <tr>
                <td>
                    <input
                        type="text"
                        value={symbol}
                        onChange={this.onSymbolChange}
                        placeholder="New symbol"
                    />
                </td>
                <td/>
                <td>
                    <input
                        type="text"
                        value={quantity}
                        onChange={this.onQuantityChange}
                        placeholder="0"
                    />
                </td>
                <td/>
                <td/>
            </tr>
        )
    }

    /*
    Handle input change for the stock symbol.
     */
    onSymbolChange(event) {
        const symbol = event.target.value;
        const quantity = this.props.quantity;
        const newEntry = {symbol: symbol, quantity: quantity};
        this.props.onUpdate(newEntry);
    }

    /*
    Handle input change for the stock quantity.
     */
    onQuantityChange(event) {
        const symbol = this.props.symbol;
        const quantity = event.target.value;
        const newEntry = {symbol: symbol, quantity: quantity};
        this.props.onUpdate(newEntry);
    }
}

/*
Component displays the sum of the stocks of the portfolio.
 */
class SumLine extends React.Component {
    render() {
        const sum = currencyRound(this.props.sum);
        const currency = getCurrencySymbol(this.props.currency);

        return (
            <p>Total value of Portfolio: {sum} {currency}</p>
        );
    }
}

/*
Component displays the interactive buttons for each portfolio.
 */
class SubmitLine extends React.Component {
    render() {
        /* Choose the currency symbol of the other currency in each case. */
        let currency = this.props.currency;
        if (currency === "eur") {
            currency = "$";
        } else {
            currency = "€";
        }

        return (
            <div>
                <button onClick={this.props.onAdd}>Add stock</button>
                <button onClick={this.props.onRemove}>Remove selected</button>
                <button onClick={this.props.onCurrencySwitch}>Show in {currency}</button>
                <button onClick={this.props.onShowGraph}>Show graph</button>
            </div>
        )
    }
}

/*
Component is not implemented because of a shortness of time for me personally.
Furthermore the API for the stocks is not really fitting in my opinion, since as far as I am concerned,
you would have to fetch 20 years of data if someone selects a time span of some days but years ago.
 */
class GraphPopup extends React.Component {
    render() {
        const portfolio = this.props.portfolio;

        const iconStyle = {fontSize: "32px"};

        return (
            <div className="popupWrapper">
                <div className="popup">
                    <h1>{portfolio.name}</h1>
                    <p>Not implemented.</p>
                    <i className="fa fa-times-circle closeGraph"
                       onClick={this.props.close}
                       style={iconStyle} />
                </div>
            </div>
        );
    }
}

$(document).ready(function() {
    /* Render single page app as soon as the document is ready. */
    ReactDOM.render(
        <App />,
        document.getElementById("reactRoot")
    );

    /* Change close icon on hover. */
    $(".closeIcon").mouseover(function() {
        $(this).removeClass("fa-times-circle").addClass("fa-close");
    });
    $(".closeIcon").mouseout(function() {
        $(this).removeClass("fa-close").addClass("fa-times-circle");
    });
});

/*
Checks if an object is empty.
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/*
Rounds a float to two decimal places.
 */
function currencyRound(val) {
    val = Number(val);
    var str = val.toFixed(2);
    return Number(str);
}

/*
Gets the currency symbol from a given currency.
 */
function getCurrencySymbol(currency) {
    switch (currency) {
        case "eur":
            return "€";
        case "usd":
            return "$";
        default:
            return "$";
    }
}