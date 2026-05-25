// ============================
// MENU HAMBURGER
// ============================

const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Abrir/Fechar menu ao clicar no botão
menuToggle.addEventListener('click', function() {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fechar menu ao clicar em um link
const navLinks = document.querySelectorAll('.nav-list a');
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ============================
// CARROSSEL
// ============================

let slideIndex = 0;
let slideTimer;

// Inicializar o carrossel
function initCarousel() {
    showSlide(slideIndex);
    autoSlide();
}

// Mostrar slide específico
function currentSlide(n) {
    clearTimeout(slideTimer);
    showSlide(slideIndex = n);
    autoSlide();
}

// Mudar slide (próximo ou anterior)
function changeSlide(n) {
    clearTimeout(slideTimer);
    showSlide(slideIndex += n);
    autoSlide();
}

// Função para exibir o slide
function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    // Validar índice
    if (n >= slides.length) {
        slideIndex = 0;
    }
    if (n < 0) {
        slideIndex = slides.length - 1;
    }
    
    // Esconder todos os slides
    slides.forEach(slide => {
        slide.style.display = 'none';
    });
    
    // Remover classe active de todos os dots
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Mostrar o slide atual
    slides[slideIndex].style.display = 'block';
    dots[slideIndex].classList.add('active');
}

// Auto-slide a cada 5 segundos
function autoSlide() {
    slideTimer = setTimeout(() => {
        slideIndex++;
        showSlide(slideIndex);
        autoSlide();
    }, 5000);
}

// Pausar auto-slide ao passar o mouse sobre o carrossel
const carousel = document.querySelector('.carousel');
if (carousel) {
    carousel.addEventListener('mouseenter', function() {
        clearTimeout(slideTimer);
    });
    
    carousel.addEventListener('mouseleave', function() {
        autoSlide();
    });
}

// ============================
// FORM CONTATO - COM SEGURANÇA
// ============================

const contatoForm = document.querySelector('.contato-form');

if (contatoForm) {
    // Adicionar CSRF token se disponível
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
    
    contatoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Coletar dados do formulário
        const nome = contatoForm.querySelector('input[type="text"]').value.trim();
        const email = contatoForm.querySelector('input[type="email"]').value.trim();
        const mensagem = contatoForm.querySelector('textarea').value.trim();
        
        // Validação completa
        const validacao = validarFormulario(nome, email, mensagem);
        if (!validacao.valido) {
            mostrarErro(validacao.mensagem);
            return;
        }
        
        // Desabilitar botão durante envio
        const submitBtn = contatoForm.querySelector('.submit-btn');
        const textoBtnOriginal = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        try {
            // Preparar dados sanitizados
            const dadosFormulario = {
                nome: sanitizarTexto(nome),
                email: sanitizarEmail(email),
                mensagem: sanitizarTexto(mensagem),
                data: new Date().toISOString(),
                pagina: window.location.href
            };
            
            // Se tiver URL de backend, enviar dados
            const urlBackend = document.querySelector('meta[name="backend-url"]')?.content;
            
            if (urlBackend) {
                await enviarDadosParaBackend(urlBackend, dadosFormulario, csrfToken);
            } else {
                // Fallback: Usar Formspree (gratuito)
                await enviarViaFormspree(dadosFormulario);
            }
            
            // Sucesso
            mostrarSucesso(`Obrigado, ${dadosFormulario.nome}! Sua mensagem foi enviada com sucesso. Entraremos em contato em breve!`);
            contatoForm.reset();
            
        } catch (erro) {
            mostrarErro(`Erro ao enviar: ${erro.message}. Tente novamente ou entre em contato por telefone.`);
            console.error('Erro no formulário:', erro);
        } finally {
            // Restaurar botão
            submitBtn.disabled = false;
            submitBtn.textContent = textoBtnOriginal;
        }
    });
}

/**
 * Valida dados do formulário
 */
function validarFormulario(nome, email, mensagem) {
    if (!nome || nome.length < 3) {
        return { valido: false, mensagem: 'Nome deve ter pelo menos 3 caracteres.' };
    }
    
    if (!email || !validarEmail(email)) {
        return { valido: false, mensagem: 'Por favor, insira um email válido.' };
    }
    
    if (!mensagem || mensagem.length < 10) {
        return { valido: false, mensagem: 'Mensagem deve ter pelo menos 10 caracteres.' };
    }
    
    if (mensagem.length > 5000) {
        return { valido: false, mensagem: 'Mensagem não pode exceder 5000 caracteres.' };
    }
    
    // Validar para spam
    if (temPalavrasProibidas(mensagem) || temLinksExcessivos(mensagem)) {
        return { valido: false, mensagem: 'Sua mensagem contém conteúdo suspeito. Por favor, revise.' };
    }
    
    return { valido: true };
}

/**
 * Valida formato de email
 */
function validarEmail(email) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexEmail.test(email) && email.length <= 254;
}

/**
 * Sanitiza texto removendo caracteres perigosos
 */
function sanitizarTexto(texto) {
    const div = document.createElement('div');
    div.textContent = texto; // textContent evita XSS
    return div.innerHTML;
}

/**
 * Sanitiza e valida email
 */
function sanitizarEmail(email) {
    // Remove espaços e converte para minúsculas
    return email.toLowerCase().trim();
}

/**
 * Detecta palavras proibidas/spam
 */
function temPalavrasProibidas(texto) {
    const palavrasProibidas = ['viagra', 'casino', 'loteria', 'click aqui', 'ganhe dinheiro'];
    const textoLower = texto.toLowerCase();
    return palavrasProibidas.some(palavra => textoLower.includes(palavra));
}

/**
 * Detecta links em excesso (spam)
 */
function temLinksExcessivos(texto) {
    const regexLinks = /https?:\/\/|www\./gi;
    const matches = texto.match(regexLinks) || [];
    return matches.length > 2;
}

/**
 * Envia dados para backend seguro
 */
async function enviarDadosParaBackend(url, dados, csrfToken) {
    const resposta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(dados)
    });
    
    if (!resposta.ok) {
        throw new Error(`Servidor respondeu com status ${resposta.status}`);
    }
    
    return await resposta.json();
}

/**
 * Envia via Formspree (serviço gratuito)
 */
async function enviarViaFormspree(dados) {
    const formspreeId = document.querySelector('meta[name="formspree-id"]')?.content;
    
    if (!formspreeId) {
        // Se não configurar Formspree, apenas armazenar localmente
        armazenarMensagemLocal(dados);
        return;
    }
    
    const resposta = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    
    if (!resposta.ok) {
        throw new Error('Erro ao enviar via Formspree');
    }
}

/**
 * Armazena mensagem no localStorage (backup local)
 */
function armazenarMensagemLocal(dados) {
    try {
        let mensagens = JSON.parse(localStorage.getItem('mensagensContato') || '[]');
        mensagens.push(dados);
        // Manter apenas últimas 50 mensagens
        if (mensagens.length > 50) mensagens.shift();
        localStorage.setItem('mensagensContato', JSON.stringify(mensagens));
    } catch (erro) {
        console.warn('Não foi possível armazenar mensagem localmente', erro);
    }
}

/**
 * Mostrar mensagem de erro
 */
function mostrarErro(mensagem) {
    const div = document.createElement('div');
    div.className = 'alerta alerta-erro';
    div.textContent = '❌ ' + mensagem;
    inserirAlerta(div);
}

/**
 * Mostrar mensagem de sucesso
 */
function mostrarSucesso(mensagem) {
    const div = document.createElement('div');
    div.className = 'alerta alerta-sucesso';
    div.textContent = '✓ ' + mensagem;
    inserirAlerta(div);
}

/**
 * Insere alerta na página
 */
function inserirAlerta(div) {
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        max-width: 400px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    const formulario = document.querySelector('.contato-form');
    if (formulario) {
        formulario.parentElement.insertBefore(div, formulario);
    } else {
        document.body.appendChild(div);
    }
    
    // Remover após 5 segundos
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 5000);
}

// ============================
// SMOOTH SCROLL (Suporte adicional)
// ============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================
// INICIALIZAR NA PÁGINA CARREGADA
// ============================

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    
    // Adicionar classe active ao primeiro dot
    const firstDot = document.querySelector('.dot');
    if (firstDot) {
        firstDot.classList.add('active');
    }
    
    // Mostrar primeiro slide
    const firstSlide = document.querySelector('.slide');
    if (firstSlide) {
        firstSlide.style.display = 'block';
    }
});
