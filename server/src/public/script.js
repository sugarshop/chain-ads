// async function getCounter() {
//     const response = await fetch('/counter');
//     const data = await response.json();
//     document.getElementById('counterResult').innerText = 'Counter: ' + data.counter;
// }

// async function increaseCounter() {
//     await fetch('/increase', { method: 'POST' });
//     getCounter();
// }

// document.getElementById('inventoryForm').onsubmit = async (e) => {
//     e.preventDefault();
//     const tags = document.getElementById('inventoryTags').value;
//     const response = await fetch('/uploadInventoryAds', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ adTags: tags })
//     });
//     const result = await response.text();
//     document.getElementById('inventoryResult').innerHTML = result;
// };

document.getElementById('budgetForm').onsubmit = async (e) => {
    e.preventDefault();
    const tags = document.getElementById('budgetTags').value;
    const url = document.getElementById('budgetUrl').value;
    const response = await fetch('/uploadBudgetAds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adTags: tags, url: url })
    });
    const result = await response.text();
    document.getElementById('budgetResult').innerHTML = result;
};

document.getElementById('pullAdsForm').onsubmit = async (e) => {
    e.preventDefault();
    const tags = document.getElementById('pullTags').value;
    const logic = document.getElementById('pullLogic').value;
    const response = await fetch('/pullAds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tags, logic: logic })
    });
    const result = await response.text();
    document.getElementById('pullResult').innerHTML = result;
};