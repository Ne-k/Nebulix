// src/main.ts
import './style.css';
import { initializeForm } from './Components/Form';
import { initializeVanta } from './Components/Background';

document.addEventListener('DOMContentLoaded', () => {
    document.body.innerHTML = `
    <div class="container">
      <div class="box">
        <div class="top-box">
          <p class="text">Nebulix Trading Form</p>
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
          <p class="disclaimer">*Submitting this form will send a message to the team's communications server. <br>*If you have any issues reach out to a team member.</p>
          <p class="disclaimer-large">This page is protected by ReCaptcha and the Google <b><a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a></b> and <b><a href="https://policies.google.com/terms" target="_blank">Terms of Service</a></b> apply.</p>
          <button type="submit" class="submit-button">Submit</button>
        </form>
      </div>
    </div>
    <div class="top-right">
      <a id="github-link" href="https://github.com/Ne-k/Nebulix" target="_blank">
        <svg height="32" viewBox="0 0 16 16" width="32" aria-hidden="true">
          <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span class="github-text">View on Github</span>
      </a>
    </div>
  `;

    initializeVanta();
    initializeForm();
});
