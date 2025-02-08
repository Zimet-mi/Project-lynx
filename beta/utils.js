export async function getSheetId() {
    const url = 'https://script.google.com/macros/s/AKfycbxemxyuf8cFQCnr1joWtAzRqhIyfeTCU2OU19RrWac57c0HuANTdNRb7i21iVEr9yNQ/exec';
    const response = await fetch(url);
    return response.text();
}

export async function fetchDataWithCache(sheetName, range, cacheKey, cacheTimeKey, cacheExpiry) {
    const SHEET_ID = await getSheetId();
    const API_KEY = 'AIzaSyCYgExuxs0Kme9-tWRCsz4gVD9yRjHY74g'; // Замените на ваш API ключ

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cachedData && cachedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(cachedTime);

        if (timeDiff < cacheExpiry) {
            return JSON.parse(cachedData);
        }
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const data = await response.json();

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheTimeKey, new Date().getTime().toString());

    return data;
}

export function initializeAccordions() {
    const accordions = document.getElementsByClassName("accordion");

    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function () {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
                $(panel).find('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
            }
        });
    }

    $('a.lightzoom').lightzoom({ speed: 400, overlayOpacity: 0.5 });
}

export function (cellContent, isLink = false, colspan = 1, isHeader = false) {
    const cell = document.createElement(isHeader ? 'th' : 'td');

    if (isLink) {
        const link = document.createElement('a');
        link.href = `card/${cellContent}.jpg`;
        link.textContent = cellContent;
        link.classList.add('lightzoom');
        cell.appendChild(link);
    } else {
        cell.textContent = cellContent;
    }

    if (colspan > 1) {
        cell.setAttribute('colspan', colspan);
    }

    return cell;
}