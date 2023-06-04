import './style.css';

const apiKey = document.querySelector<HTMLInputElement>('#api-key')!;
const updateButton = document.querySelector<HTMLButtonElement>('#update-key')!;

chrome.storage.local.get(['apiKey'], (result) => {
	if (!result.apiKey) {
		return;
	}
	apiKey.value = result.apiKey;
});

updateButton.addEventListener('click', () => {
	const newKey = apiKey.value;

	chrome.storage.local.set({ apiKey: newKey }, () => {
		console.log('Value is set to ' + newKey);
	});
});
