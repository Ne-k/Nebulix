declare var grecaptcha: any;
import dotenv from 'dotenv';

dotenv.config()

export const initializeForm = () => {
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
            const token = await grecaptcha.enterprise.execute(process.env.RECAPTCHA_SITE_KEY, { action: 'submit' });

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
        const reCaptcha = document.querySelector<HTMLInputElement>('#recaptchaToken');

        if (!nameInput || !teamInput || !contactInput || !offerInput || !tradeForInput || !reCaptcha) {
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
};