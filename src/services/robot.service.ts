import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { parse } from 'node-html-parser';
import { config } from '../config';

const PRESTO_EXTENSION_PATH="./extensions/presto/0.77.0_0"
const PRESTO_LOGIN_URL = "https://console.presto.oystr.com.br/"

class Scraper {
    /**
     * Instancia um objeto Scraper para interagir com o navegador via Playwright.
     */
    private page: Page | undefined;
    private context: BrowserContext | undefined;
    private cfg = config

    async init() {
        this.setupCleanupHandlers();
    }

    async close() {
        if (this.context) {
            console.log('\nFechando browser...');
            await this.context.close();
            console.log('Browser fechado com sucesso');
        }
    }    

    private setupCleanupHandlers() {
        // Ctrl+C
        process.on('SIGINT', async () => {
            console.log('\nSIGINT recebido (Ctrl+C)');
            await this.close();
            process.exit(0);
        });

        // Kill
        process.on('SIGTERM', async () => {
            console.log('\nSIGTERM recebido');
            await this.close();
            process.exit(0);
        });

        // Erros não capturados
        process.on('uncaughtException', async (error) => {
            console.error('Erro não capturado:', error);
            await this.close();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason) => {
            console.error('Promise rejeitada não tratada:', reason);
            await this.close();
            process.exit(1);
        });
    }    
    
    /**
     * Prepara o contexto do navegador para utilizar a extensão Presto.
     */
    async initiateBrowser() {
          const contextOptions: any = {
            permissions: ['clipboard-read', 'clipboard-write'],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo',
          };    

        this.context = await chromium.launchPersistentContext('./user-data', {
            headless: false,
            args: [
                `--disable-extensions-except=${PRESTO_EXTENSION_PATH}`,
                `--load-extension=${PRESTO_EXTENSION_PATH}`,
                `--no-sandbox`,
                `--disable-setuid-sandbox`,
                `--disable-dev-shm-usage`,
                `--start-maximized`,
            ],
            ...contextOptions
        })
        const pages = this.context.pages();
        this.page = pages.length > 0 ? pages[0] : await this.context.newPage()
    }

    async isLoggedIn(selector: string): Promise<boolean> {
        const reference = this.page!.locator(selector)
         const isLoggedIn =await reference.waitFor({ 
            state: 'visible',
            timeout: 5000 
        }).catch(() => false)

        if (!isLoggedIn) {
            return false    
        }
        return true
    }

    /**
     * Faz login no Presto com email e senha do usuário.
     * 
     * Isso garante que a extensão Presto esteja pronta para ser utilizada no sistema alvo.
     */
    async loginPresto() {
        if (!this.page) throw new Error('Page not initialized');
        
        await this.page.goto(PRESTO_LOGIN_URL)

        const isLoggedIn = await this.isLoggedIn('//button[text()="Sair"]')
        if (isLoggedIn) return

        await this.page.fill('input[type=text]', this.cfg.prestoEmail)
        await this.page.click('//button[text()="Acessar"]')
        await this.page.fill('input[type=password]', this.cfg.prestoSenha)
        await this.page.click('//button[text()="Login"]')
        await this.page.waitForSelector('button[title=Sair]');
    }

    /**
     *Faz login no sistema alvo utilizando o certificado digital via Presto
     */
    async loginSistema() {
        if (!this.page) throw new Error('Page not initialized');

        const url_login = "https://esaj.tjsp.jus.br/sajcas/login"
        await this.page.goto(url_login)
        
        console.log("Realizando login no sistema...")
        
        await this.page.click('a[id=linkAbaCertificado]')
        
        await this.page.waitForSelector('#certificados');
        
        const fullOptionText = await this.page.getByText(/Guilherme/).textContent() as string;
        await this.page.selectOption('#certificados', { label: fullOptionText });
        
        await this.page.click("input[type='button'][id='submitCertificado']:not([style*='display: none'])")
        
        await this.page.waitForSelector("input[placeholder='PIN']", { timeout: 10000 })
        await this.page.fill("//input[@placeholder='PIN']", this.cfg.prestoPin)
        await this.page.click("//button[text()='Validar']")
        await this.page.waitForSelector("#menu-title", { timeout: 10000 })
        console.log("Login realizado com sucesso!")
    }

    /**
     * Extrai andamentos de um processo judicial a partir do número do processo
     * 
     * **Usage:**
     * ```ts
     * const processos = [
     *   "0000000-00.2022.0.00.0000",
     *   "1111111-11.2024.1.11.1111",
     * ]
     * 
     * const processosMap: Map<string, string> = new Map()
     * 
     * this.init()
     * await this.initiateBrowser()
     * await this.loginPresto()
     * await this.loginSistema()
     * for (const processo of processos) {
     *   const data = await this.extrairAndamentos(processo)
     *   processosMap.set(processo, data)
     *   await this.page?.waitForTimeout(1000)
     * }
     * console.log("Processos extraídos:", processosMap)    
     * 
     * ```
     * 
     * @param numeroProcesso número do processo em string
     * @returns 
     */
    async extrairAndamentos(numeroProcesso: string) {
        if (!this.page) throw new Error('Page not initialized');
        
        const processoSplited = splitNumeroProcesso(numeroProcesso)
        const url_consulta = `https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${processoSplited.numeroDigito}${processoSplited.ano}&foroNumeroUnificado=${processoSplited.numeroForo}&dadosConsulta.valorConsultaNuUnificado=${numeroProcesso}&dadosConsulta.valorConsultaNuUnificado=UNIFICADO&dadosConsulta.valorConsulta=&dadosConsulta.tipoNuProcesso=UNIFICADO`
        
        await this.page.goto(url_consulta)
        await this.page.waitForSelector("#tabelaUltimasMovimentacoes")
        const htmlContent = await this.getParsedHTML()
        const todasMovimentacoes = htmlContent.querySelector("#tabelaTodasMovimentacoes")
        const tableRows = todasMovimentacoes?.querySelectorAll("tr") || []
        
        const tableContent = tableRows.map(row => {
            const cols = row.querySelectorAll("td")
            const data =cols[0]?.text.trim() || ''
            const lastCol = cols[cols.length - 1]
            const texto = lastCol?.text.trim() || ''
            return { data, texto }
        })
        return JSON.stringify(tableContent)
    }

    /**
     * Extrai metadata de um processo judicial a partir do número do processo
     * 
     * A ideia principal é que seja utilizada assim que um processo entra na cateira de processos para que ele possa ter seus metadados extraídos e assim um novo processo seja cadastrado no sistema.
     * 
     * **Usage:**
     * @param numeroProcesso número do processo em string
     * @returns
    */
   async extrairMetadados(numeroProcesso: string) {
        if (!this.page) throw new Error('Page not initialized');

        const processoSplited = splitNumeroProcesso(numeroProcesso)
        const url_consulta = `https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${processoSplited.numeroDigito}${processoSplited.ano}&foroNumeroUnificado=${processoSplited.numeroForo}&dadosConsulta.valorConsultaNuUnificado=${numeroProcesso}&dadosConsulta.valorConsultaNuUnificado=UNIFICADO&dadosConsulta.valorConsulta=&dadosConsulta.tipoNuProcesso=UNIFICADO`
        
        await this.page.goto(url_consulta)
        await this.page.waitForSelector("#tabelaUltimasMovimentacoes")
        const htmlContent = await this.getParsedHTML()
        
        const classeProcesso = htmlContent.querySelector("#classeProcesso")?.text.trim() || ''
        const assuntoProcesso = htmlContent.querySelector("#assuntoProcesso")?.text.trim() || ''
        const foroProcesso = htmlContent.querySelector("#foroProcesso")?.text.trim() || ''
        const varaProcesso = htmlContent.querySelector("#varaProcesso")?.text.trim() || ''
        const juizProcesso = htmlContent.querySelector("#juizProcesso")?.text.trim() || ''
        const areaProcesso = htmlContent.querySelector("#areaProcesso")?.text.trim() || ''
        const valorAcaoProcesso = htmlContent.querySelector("#valorAcaoProcesso")?.text.trim().replace('R$ ', '').replace('.', '').replace(',', '.') || ''
        
        const metadados = {
            classeProcesso: classeProcesso,
            assuntoProcesso: assuntoProcesso,
            foroProcesso: foroProcesso,
            varaProcesso: varaProcesso,
            juizProcesso: juizProcesso,
            areaProcesso: areaProcesso,
            valorAcaoProcesso: valorAcaoProcesso
        }

        return JSON.stringify(metadados)
    }

    async getParsedHTML() {
        const htmlContent = await this.page!.content()
        const root = parse(htmlContent)
        return root
    }    

    async run() {
        const processos = [
            "1027910-13.2022.8.26.0002",
            "1049501-91.2023.8.26.0100"
        ]

        const processosMap: Map<string, string> = new Map()
        try {
            this.init()
            await this.initiateBrowser()
            await this.loginPresto()
            await this.loginSistema()
            // for (const processo of processos) {
            //     const data = await this.extrairAndamentos(processo)
            //     processosMap.set(processo, data)
            //     await this.page?.waitForTimeout(1000)
            // }
            // console.log("Processos extraídos:", processosMap)

            // type Processo = {
            //     data: string;
            //     texto: string;
            // }
            // const proc: Processo = JSON.parse(processosMap.get(processos[0]!) as string)[0]
            // console.log(proc.data)
            // console.log(proc.texto)
            
            for (const processo of processos) {
                const data = await this.extrairMetadados(processo)
                processosMap.set(processo, data)
                await this.page?.waitForTimeout(1000)
            }
            console.log("Metados extraídos:", processosMap)

            type MetadadosProcesso = {
                classeProcesso: string;
                assuntoProcesso: string;
                foroProcesso: string;
                varaProcesso: string;
                juizProcesso: string;
                areaProcesso: string;
                valorAcaoProcesso: string;
            }
            
            const proc: MetadadosProcesso = JSON.parse(processosMap.get(processos[0]!) as string)
            console.log(proc.classeProcesso)
            console.log(proc.assuntoProcesso)
            console.log(proc.foroProcesso)
            console.log(proc.varaProcesso)
            console.log(proc.juizProcesso)
            console.log(proc.areaProcesso)
            console.log(proc.valorAcaoProcesso)

            console.log("Execução finalizada com sucesso!")
        } catch (error) {
            console.error('Erro durante a execução:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}


export function splitNumeroProcesso(numeroProcesso: string) {
    const processoSplited = numeroProcesso.split(".")
    const numeroDigito = processoSplited[0]
    const ano = processoSplited[1]
    const orgao = processoSplited[2]
    const tribunal = processoSplited[3]
    const numeroForo = processoSplited[4]
    
    return {
        numeroDigito: numeroDigito,
        ano: ano,
        orgao: orgao,
        tribunal: tribunal,
        numeroForo: numeroForo
    }
}
async function main() {
    const scraper = new Scraper()
    await scraper.run()
}

main()