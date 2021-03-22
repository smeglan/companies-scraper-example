const request = require('request');
const cheerio = require('cheerio');

const sortedCompanies = []

const fillCompanies = () => {
    request('https://en.wikipedia.org/wiki/List_of_largest_energy_companies', (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html)
            const tableCompanies = $('.wikitable > tbody');
            const companies = []
            let count = 0;
            tableCompanies.each((i, row) => {
                const company = {}
                $(row).find("td").each(async (j, col) => {
                    switch (j) {
                        case (9 * count) + 1:
                            const info = $(col).text();
                            company['name'] = info.split("NYSE:")[0];
                            company['nyse'] = info.split("NYSE:")[1];
                            company['link'] = $(col).find('a').attr('href');
                            break;
                        case (9 * count) + 2:
                            company['country'] = $(col).text().replace("\n", "");
                            count = count + 1;
                            companies.push({ ...company })
                        default:
                            break;
                    }
                })
                fillDates(companies);
            })
        } else {
            return "error =>" + error;
        }
    });
}

const fillDates = (companies) => {
    companies.forEach(element => {
        request('https://en.wikipedia.org/' + element.link, (err, resp, html) => {
            const $ = cheerio.load(html)
            const info = $('.infobox > tbody > tr');
            info.each((i, row) => {
                $(row)
                if ($(row).text().includes("Founded")) {
                    const str = $(row).text().replace("Founded", "")
                    matches = str.match(/\d+/g);
                    year = 0
                    matches.forEach(element => {
                        if (element > 1000) {
                            year = element;
                        }
                    });
                    element["founded"] = year;
                    sortCompany(element);
                }
            })
        });
    });
}

const sortCompany = (company) => {
    sortedCompanies.push(company);
    if (sortedCompanies.length === 20) {
        sortedCompanies.sort(compareMethod)
        var dictstring = JSON.stringify(sortedCompanies);
        var fs = require('fs');
        fs.writeFile("companies.json", dictstring, function (err, result) {
            if (err) {
                console.log('error', err);
            }else{
                console.log("Ok");
            }
        });
    }
}

const compareMethod = (a, b) => {
    return a.founded - b.founded;
}

const scraper = () => {
    fillCompanies();
}

scraper();