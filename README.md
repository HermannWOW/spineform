# SpineForm

Ficha online desenvolvida para otimizar e digitalizar o processo de avaliação clínica em fisioterapia, com foco especializado em disfunções e patologias da coluna vertebral.

## 📋 Sobre o Projeto

Este projeto tem como objetivo substituir os tradicionais registos em papel por uma solução digital ágil, estruturada e centralizada. A plataforma permite que os fisioterapeutas preencham, consultem e acompanhem a evolução clínica de cada paciente de forma intuitiva durante as consultas, garantindo um histórico detalhado e acessível.

## ✨ Funcionalidades Principais

*   **Registo Anamnese Completo:** Recolha estruturada de dados pessoais, histórico médico, queixa principal e hábitos de vida do paciente.
*   **Testes Ortopédicos e neurológicos:** Campos específicos para registo de testes clínicos direcionados à coluna vertebral (cervical, torácica e lombar).
*   **Avaliação Postural e de Mobilidade:** Módulos para mapear amplitudes de movimento, desvios posturais e pontos de dor (escala visual analógica - EVA).
*   **Evolução Clínica:** Registo de acompanhamento por sessão, permitindo monitorizar o progresso do tratamento ao longo do tempo.
*   **Interface Otimizada:** Design responsivo e focado na usabilidade clínica para preenchimento rápido em computadores, tablets ou smartphones.

## Mapa corporal

O mapa usa SVG inline com 25 regiões na frente e 25 nas costas. Cada região mantém seu próprio estado durante o preenchimento: sem marcação → dor → formigamento → queimação → choque → irradiação → sem marcação.

As regiões podem ser marcadas por clique, toque, Enter ou Espaço. O seletor abaixo de cada vista oferece uma alternativa para áreas pequenas. Os lados indicam o lado do paciente; na vista frontal, o lado esquerdo do paciente aparece à direita da tela.

`js/body-map.js` concentra os contornos, identificadores estáveis e cores usados por `js/app.js` e `js/pdf.js`. O PDF mantém os contornos vetoriais, inclui as cores dos sintomas, lista as regiões marcadas e registra o lado predominante. Não há persistência após recarregar a página, seguindo o comportamento atual da ficha.
