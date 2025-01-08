import './style.css';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';
declare var grecaptcha: any;

document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = `
    <div class="container">
      <div class="box">
        <div class="top-box">
          <p class="text">FRC 7034 Trading Form</p>
        </div>
        <form class="trade-form" id="trade-form">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required>
          <label for="team">Team/Affiliation: </label>
          <input type="text" id="team" name="team" required>
          <label for="contact">Contact Information:</label>
          <input type="text" id="contact" name="contact" required>
          <label for="offer">Trade Offer:</label>
          <input type="text" id="offer" name="offer" required>
          <label for="tradeFor">Trade Request:</label>
          <input type="text" id="tradeFor" name="tradeFor" required>
          <input type="hidden" name="recaptchaToken" id="recaptchaToken" />
          <p class="disclaimer">*Submitting this form will send a message to the team's communications server and is limited to 3 submissions per minute.<br>* If you have any issues reach out to a team member.</p>
          <button type="submit" class="submit-button">Submit</button>
        </form>
      </div>
    </div>
    <div class="top-right">
      <a id="github-link" href="https://github.com/Ne-k/Nebulix" target="_blank">
        <svg height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true">
          <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span class="github-text">View on Github</span>
      </a>
    </div>
  `;

    NET({
        el: "body",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 0.50,
        scaleMobile: 0.50,
        color: 0x1E5631,
        backgroundColor: 0x0B3D0B,
        points: 10.00,
        maxDistance: 20.00,
        spacing: 15.00,
        THREE: THREE
    });

    const form = document.querySelector<HTMLFormElement>('.trade-form');
    const submitButton = form?.querySelector<HTMLButtonElement>('.submit-button');

    const checkFormValidity = () => {
        const nameInput = document.querySelector<HTMLInputElement>('#name');
        const teamInput = document.querySelector<HTMLInputElement>('#team');
        const contactInput = document.querySelector<HTMLInputElement>('#contact');
        const offerInput = document.querySelector<HTMLInputElement>('#offer');
        const tradeForInput = document.querySelector<HTMLInputElement>('#tradeFor');

        if (nameInput?.value && teamInput?.value && contactInput?.value && offerInput?.value && tradeForInput?.value) {
            submitButton?.removeAttribute('disabled');
        } else {
            submitButton?.setAttribute('disabled', 'true');
        }
    };

    form?.addEventListener('input', checkFormValidity);

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        grecaptcha.enterprise.ready(async () => {
            const token = await grecaptcha.enterprise.execute('6LcWVLEqAAAAALTM8-wLsYE9DQbX9x2SsqCPjE5p', {action: 'submit'});

            const recaptchaTokenField = document.getElementById('recaptchaToken') as HTMLInputElement;
            if (recaptchaTokenField) {
                recaptchaTokenField.value = token;
            }
            await onSubmit(token);
        });
    });

    const onSubmit = async (token: string) => {
        const nameInput = document.querySelector<HTMLInputElement>('#name');
        const teamInput = document.querySelector<HTMLInputElement>('#team');
        const contactInput = document.querySelector<HTMLInputElement>('#contact');
        const offerInput = document.querySelector<HTMLInputElement>('#offer');
        const tradeForInput = document.querySelector<HTMLInputElement>('#tradeFor');

        if (!nameInput || !teamInput || !contactInput || !offerInput || !tradeForInput) {
            console.error('One or more form elements are missing.');
            alert('Failed to submit form. Please try again.');
            return;
        }

        const name = nameInput.value;
        const team = teamInput.value;
        const contact = contactInput.value;
        const offer = offerInput.value;
        const tradeFor = tradeForInput.value;
        const payload = new FormData();
        payload.append('name', name);
        payload.append('team', team);
        payload.append('contact', contact);
        payload.append('offer', offer);
        payload.append('tradeFor', tradeFor);
        payload.append('recaptchaToken', token);

        submitButton?.setAttribute('disabled', 'true');

        try {
            const response = await fetch('/api/sendWebhook', {
                method: 'POST',
                body: payload,
            });

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Too many requests. Please try again in a minute or two. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
                } else {
                    throw new Error('Network response was not ok. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
                }
            }

            alert('Your form has been submitted, you may be contacted soon by a team member...');
            window.location.reload();
        } catch (error: unknown) {
            console.error('Error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Too many requests')) {
                    alert('You have been rate-limited. Please try again in the next minute or two. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
                } else {
                    alert('There was an error submitting your form. Please try again later. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
                }
            } else {
                alert('An unknown error occurred. Please try again later. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
            }
            submitButton?.removeAttribute('disabled');
        }
    };

    submitButton?.removeAttribute('disabled');
});
