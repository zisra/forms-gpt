export {};

function makePrompt(prompt: string) {
	const finalPrompt = `Answer the following multiple choice question. Only give me the answer to the question below without any other text. Keep in mind that this may or may not be multiple choice:\n${prompt.replace(
		/\d+ points/,
		''
	)}`;
	console.log(`[Prompt]: ${finalPrompt}`);
	return finalPrompt;
}

chrome.storage.local.get(['apiKey'], ({ apiKey }) => {
	if (!apiKey) {
		return;
	}

	async function executeRequest(prompt: string) {
		try {
			const response = await fetch(
				'https://api.openai.com/v1/chat/completions',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						model: 'gpt-3.5-turbo',
						messages: [
							{
								role: 'user',
								content: makePrompt(prompt),
							},
						],
						max_tokens: 150,
						temperature: 0.5,
					}),
				}
			);
			const { error, choices } = await response.json();
			if (error) {
				throw new Error(error.message);
			}

			const answer = choices[0].message.content;
			console.log(`[Answer]: ${answer}`);

			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.scripting.executeScript({
					target: { tabId: tabs[0].id as number },
					func: (answer) => {
						const div = document.createElement('div');
						div.innerText = answer;
						div.id = 'answer';
						div.style.position = 'fixed';
						div.style.fontSize = '12px';
						div.style.bottom = '10px';
						div.style.left = '10px';
						div.style.backgroundColor = '#323232';
						div.style.padding = '10px';
						div.style.border = '1px solid black';
						div.style.borderRadius = '2px';
						div.style.color = '#323232';
						div.style.opacity = '0.1';
						div.addEventListener('mouseover', () => {
							div.style.color = 'white';
						});
						div.addEventListener('mouseout', () => {
							div.style.color = '#323232';
						});
						document.body.appendChild(div);

						const clickHandler = () => {
							div.remove();
							document.removeEventListener('click', clickHandler);
						};
						document.addEventListener('click', clickHandler);
					},
					args: [answer],
				});
			});
		} catch (err) {
			if (err instanceof Error) {
				throw new Error(err.message);
			}
		}
	}

	chrome.contextMenus.create({
		id: 'execute-request',
		title: 'Execute Request',
		contexts: ['selection'],
	});

	chrome.contextMenus.onClicked.addListener((info, tab) => {
		if (info.menuItemId === 'execute-request') {
			chrome.scripting.executeScript(
				{
					target: { tabId: tab!.id as number },
					func: () => {
						return window.getSelection()!.toString();
					},
				},
				(selection) => {
					const prompt = selection[0].result!.toString();
					executeRequest(prompt);
				}
			);
		}
	});

	chrome.commands.onCommand.addListener((command) => {
		if (command === 'execute-request') {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				chrome.scripting.executeScript(
					{
						target: { tabId: tabs[0].id as number },
						func: () => {
							return window.getSelection()?.toString();
						},
					},
					(selection) => {
						const prompt = selection[0].result;
						if (!prompt) throw new Error('No text selected');
						executeRequest(prompt);
					}
				);
			});
		}
	});
});
