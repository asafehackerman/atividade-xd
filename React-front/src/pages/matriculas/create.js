import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import { Label, Select, Submit } from "./style";
import { Client } from '../../api/client';
import { getPermissions } from '../../service/PermissionService';
import { getDataUser } from '../../service/UserService';

export default function Create() {
    const [load, setLoad] = useState(true);
    const [alunos, setAlunos] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [alunoSelecionado, setAlunoSelecionado] = useState('');
    const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');

    const navigate = useNavigate();
    const permissions = getPermissions();
    const dataUser = getDataUser();

    // pega arrays das rotas list (simples, direto e confiável)
    async function fetchData() {
        setLoad(true);
        setTimeout(async () => {
            try {
                // chama as duas rotas em paralelo (padrão 'list' que suas telas usam)
                const [resAlunos, resDisciplinas] = await Promise.allSettled([
                    Client.get('alunos'),        // espera lista de alunos
                    Client.get('disciplinas')   // espera lista de disciplinas
                ]);

                // Helper para extrair array de res (compatível com res.data.data ou res.data)
                const extractArray = (r) => {
                    if (!r || r.status !== 'fulfilled' || !r.value) return [];
                    const v = r.value.data;
                    return Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : (Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : (Array.isArray(v) ? v : (Array.isArray(v) ? v : v)))));
                };

                // Simples e robusto: tenta vários lugares comuns
                const safeExtract = (r) => {
                    if (!r || r.status !== 'fulfilled') return [];
                    const v = r.value.data;
                    if (!v) return [];
                    if (Array.isArray(v)) return v;
                    if (Array.isArray(v.data)) return v.data;
                    if (Array.isArray(v.alunos)) return v.alunos;
                    if (Array.isArray(v.disciplinas)) return v.disciplinas;
                    return [];
                };

                let alunosData = safeExtract(resAlunos);
                let disciplinasData = safeExtract(resDisciplinas);

                // Se ainda vazio, tenta os endpoints /create (caso seu backend use esse padrão)
                if (alunosData.length === 0 || disciplinasData.length === 0) {
                    const [resAlunosCreate, resDiscipCreate] = await Promise.allSettled([
                        Client.get('alunos/create'),
                        Client.get('disciplinas/create')
                    ]);
                    if (alunosData.length === 0) alunosData = safeExtract(resAlunosCreate);
                    if (disciplinasData.length === 0) disciplinasData = safeExtract(resDiscipCreate);
                }

                // Normaliza alunos: garante { id, nome }
                const alunosNorm = (alunosData || []).map(item => {
                    const id = item?.id ?? item?.ID ?? item?.aluno_id ?? item?.id_aluno ?? '';
                    const nome = item?.nome ?? item?.name ?? item?.fullName ?? item?.nome_completo ?? '';
                    return { ...item, id, nome };
                });

                // Normaliza disciplinas: concatena "Disciplina (Curso)" no nome para facilitar escolher
                const disciplinasNorm = (disciplinasData || []).map(d => {
                    const id = d?.id ?? d?.ID ?? d?._id ?? '';
                    const discNome = d?.nome ?? d?.title ?? '';
                    const cursoNome = d?.curso?.nome ?? d?.curso?.name ?? d?.cursoName ?? '';
                    const nome = cursoNome ? `${discNome} (${cursoNome})` : discNome;
                    return { ...d, id, nome };
                });

                // Debug (verifique no console do navegador)
                console.log('alunosNorm sample:', alunosNorm[0]);
                console.log('disciplinasNorm sample:', disciplinasNorm[0]);

                setAlunos(alunosNorm);
                setDisciplinas(disciplinasNorm);

                if (alunosNorm.length > 0) setAlunoSelecionado(String(alunosNorm[0].id));
                if (disciplinasNorm.length > 0) setDisciplinaSelecionada(String(disciplinasNorm[0].id));
            } catch (err) {
                console.error('Erro fetchData matriculas:', err);
                setAlunos([]);
                setDisciplinas([]);
            } finally {
                setLoad(false);
            }
        }, 300); // pequeno delay pra manter UX parecido com outras telas
    }

    function verifyPermission() {
        if (!dataUser) navigate('/login');
        else if (permissions.createMatricula === 0) navigate(-1);
    }

    useEffect(() => {
        verifyPermission();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function sendData() {
        const matricula = {
            aluno_id: parseInt(alunoSelecionado, 10) || null,
            disciplina_id: parseInt(disciplinaSelecionada, 10) || null
        };

        try {
            const res = await Client.post('matriculas', matricula);
            console.log('POST /matriculas res:', res.data);
            navigate('/matriculas');
        } catch (err) {
            console.error('Erro ao criar matrícula:', err);
        }
    }

    return (
        <>
            <NavigationBar />
            {
                load
                    ? <Container className="d-flex justify-content-center mt-5">
                        <OrbitProgress variant="spokes" size="medium" />
                      </Container>
                    :
                      <Container className='mt-2'>
                        <Label>Aluno</Label>
                        <Select
                            name="aluno"
                            value={alunoSelecionado}
                            onChange={e => setAlunoSelecionado(e.target.value)}
                            disabled={alunos.length === 0}
                        >
                            {alunos.length === 0 && <option value="">-- Nenhum aluno disponível --</option>}
                            {alunos.map((a, i) => <option key={i} value={String(a.id)}>{a.nome}</option>)}
                        </Select>

                        <Label>Disciplina</Label>
                        <Select
                            name="disciplina"
                            value={disciplinaSelecionada}
                            onChange={e => setDisciplinaSelecionada(e.target.value)}
                            disabled={disciplinas.length === 0}
                        >
                            {disciplinas.length === 0 && <option value="">-- Nenhuma disciplina disponível --</option>}
                            {disciplinas.map((d, i) => <option key={i} value={String(d.id)}>{d.nome}</option>)}
                        </Select>

                        <Submit value="Voltar" onClick={() => navigate('/matriculas')} />
                        <Submit value="Cadastrar" onClick={sendData} />
                      </Container>
            }
        </>
    );
}
