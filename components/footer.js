class CustomFooter extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                footer {
                    background: #f9fafb;
                    color: #6b7280;
                    padding: 2rem;
                    text-align: center;
                    margin-top: auto;
                    border-top: 1px solid #e5e7eb;
                }
                .footer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .footer-links {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }
                .footer-links a {
                    color: #6b7280;
                    text-decoration: none;
                    font-size: 0.875rem;
                    transition: color 0.2s;
                }
                .footer-links a:hover {
                    color: #4f46e5;
                }
                .copyright {
                    font-size: 0.875rem;
                }
                .version {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                @media (max-width: 576px) {
                    footer {
                        padding: 1.5rem 1rem;
                    }
                    .footer-links {
                        gap: 1rem;
                        font-size: 0.813rem;
                    }
                    .copyright {
                        font-size: 0.813rem;
                    }
                }
            </style>
            <footer>
                <div class="footer-container">
                    <div class="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Documentation</a>
                        <a href="#">Support</a>
                    </div>
                    <div class="copyright">
                        &copy; ${new Date().getFullYear()} CodePulse Insights. All rights reserved.
                    </div>
                    <div class="version">
                        v1.0.0
                    </div>
                </div>
            </footer>
        `;
    }
}
customElements.define('custom-footer', CustomFooter);