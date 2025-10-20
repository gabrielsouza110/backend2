"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando a população do banco de dados...');
    console.log('🔧 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('🔌 Database URL presente:', !!process.env.DATABASE_URL);
    try {
        // Limpar dados existentes para começar do zero
        console.log('🧼 Limpando dados existentes...');
        await prisma.turmaTime.deleteMany();
        await prisma.timeJogador.deleteMany();
        await prisma.jogadorModalidade.deleteMany();
        await prisma.estatisticaJogador.deleteMany();
        await prisma.estatisticaTime.deleteMany();
        await prisma.eventoJogo.deleteMany();
        await prisma.jogoTime.deleteMany();
        await prisma.jogo.deleteMany();
        await prisma.jogador.deleteMany();
        await prisma.time.deleteMany();
        await prisma.usuario.deleteMany();
        await prisma.turma.deleteMany();
        await prisma.modalidade.deleteMany();
        await prisma.edicao.deleteMany();
        // 1. Criar Edição 2025
        console.log('🏆 Criando edição 2025...');
        const edicao = await prisma.edicao.create({
            data: {
                ano: 2025,
                nome: 'Interclasse 2025',
                descricao: 'Campeonato Interclasse do Ensino Médio 2025',
                dataInicio: new Date('2025-03-01'),
                dataFim: new Date('2025-11-30'),
                ativa: true
            }
        });
        console.log('✅ Edição criada:', edicao.nome);
        // 2. Criar Modalidades
        console.log('⚽ Criando modalidades esportivas...');
        const modalidades = await Promise.all([
            prisma.modalidade.create({
                data: {
                    nome: 'FUTSAL',
                    tipo: 'FUTSAL',
                    genero: 'Masculino',
                    icone: '⚽',
                    descricao: 'Futsal categoria masculina'
                }
            }),
            prisma.modalidade.create({
                data: {
                    nome: 'VOLEI',
                    tipo: 'VOLEI',
                    genero: 'Feminino',
                    icone: '🏐',
                    descricao: 'Vôlei categoria feminina'
                }
            }),
            prisma.modalidade.create({
                data: {
                    nome: 'BASQUETE',
                    tipo: 'BASQUETE',
                    genero: 'Misto',
                    icone: '🏀',
                    descricao: 'Basquete categoria mista'
                }
            })
        ]);
        console.log('✅ Modalidades criadas:', modalidades.length);
        // 3. Criar Turmas
        console.log('🏫 Criando turmas do ensino médio...');
        const turmas = await Promise.all([
            // 1° Ano
            prisma.turma.create({
                data: {
                    nome: '1°A',
                    serie: 1,
                    turno: 'Matutino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            }),
            prisma.turma.create({
                data: {
                    nome: '1°B',
                    serie: 1,
                    turno: 'Vespertino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            }),
            // 2° Ano
            prisma.turma.create({
                data: {
                    nome: '2°A',
                    serie: 2,
                    turno: 'Matutino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            }),
            prisma.turma.create({
                data: {
                    nome: '2°B',
                    serie: 2,
                    turno: 'Vespertino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            }),
            // 3° Ano
            prisma.turma.create({
                data: {
                    nome: '3°A',
                    serie: 3,
                    turno: 'Matutino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            }),
            prisma.turma.create({
                data: {
                    nome: '3°B',
                    serie: 3,
                    turno: 'Vespertino',
                    edicaoId: edicao.id,
                    ativa: true
                }
            })
        ]);
        console.log('✅ Turmas criadas:', turmas.length);
        // 4. Criar Usuários (Admins)
        console.log('👥 Criando usuários administradores...');
        // Admin Geral
        const adminGeral = await prisma.usuario.create({
            data: {
                nome: 'Coordenador Geral',
                email: 'admin@escola.com',
                senha: await bcryptjs_1.default.hash('admin123', 10),
                tipo: 'admin_geral',
                ativo: true
            }
        });
        console.log('✅ Admin geral criado:', adminGeral.email);
        console.log('🎉 Banco de dados populado com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro durante a população do banco de dados:', error);
        throw error;
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexão com o banco de dados encerrada');
})
    .catch(async (e) => {
    console.error('❌ Erro crítico:', e);
    await prisma.$disconnect();
    process.exit(1);
});
