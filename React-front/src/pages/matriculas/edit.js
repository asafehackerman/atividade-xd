import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container, Table, Button, Modal } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import { Client } from '../../api/client'
import { getDataUser } from '../../service/UserService';
import { getPermissions } from '../../service/PermissionService';

export default function Home() {
    const [data, setData] = useState([]);
    const [load, setLoad] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmShow, setConfirmShow] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const navigate = useNavigate();
    const dataUser  = getDataUser();
    const permissions = getPermissions();

    async function fetchData() {
        setLoad(true);
        setTimeout(async () => {
            try {
                const res = await Client.get('matriculas');
                const raw = res.data?.data ?? res.data ?? [];
                const mapped = (Array.isArray(raw) ? raw : []).map(item => {
                    const aluno = item.aluno ?? item.student ?? item.alunoData ?? null;
                    const disc = item.disciplina ?? item.course ?? item.disciplinaData ?? null;

                    const studentName = aluno?.nome ?? aluno?.name ?? item.aluno_nome ?? item.student_name ?? String(item.aluno_id ?? item.student_id ?? '');
                    const courseName = disc?.nome ?? disc?.name ?? item.disciplina_nome ?? item.course_name ?? item.disciplina?.curso?.nome ?? String(item.disciplina_id ?? item.course_id ?? item.curso_id ?? '');

                    return { ...item, student: studentName, course: courseName };
                });

                setData(mapped);
            } catch (error) {
                console.error('Erro ao buscar matriculas:', error);
                setData([]);
            } finally {
                setLoad(false);
            }
        }, 1000);
    }

    function verifyPermission() {
        if(!dataUser) navigate('/login');
        else if(permissions.listMatricula === 0) navigate(-1);
    }

    useEffect(() => {
        verifyPermission();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Abre modal de confirmação (sem usar confirm global)
    function openConfirmDialog(id) {
        setIdToDelete(id);
        setConfirmShow(true);
    }

    function closeConfirmDialog() {
        setConfirmShow(false);
        setIdToDelete(null);
    }

    // Executa exclusão após confirmação
    async function handleConfirmDelete() {
        if (!idToDelete) return;
        setDeletingId(idToDelete);
        try {
            await Client.delete(`matriculas/${idToDelete}`);
            // atualiza lista
            await fetchData();
        } catch (err) {
            console.error('Erro ao deletar matrícula:', err);
            // opcional: mostrar toast/modal de erro
        } finally {
            setDeletingId(null);
            closeConfirmDialog();
        }
    }

    return (
        <>
            <NavigationBar />
            {load ? (
                <Container className="d-flex justify-content-center mt-5">
                    <OrbitProgress variant="spokes" color="#32cd32" size="medium" text="" textColor="" />
                </Container>
            ) : (
                <Container className='mt-2'>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5>Matrículas Registradas</h5>
                        {permissions.createMatricula !== 0 && (
                            <Button variant="success" onClick={() => navigate('/matriculas/create')}>Nova Matrícula</Button>
                        )}
                    </div>

                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Estudante</th>
                                <th>Disciplina</th>
                                <th style={{ width: 200 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center">Nenhuma matrícula encontrada</td>
                                </tr>
                            ) : (
                                data.map((row, idx) => (
                                    <tr key={row.id ?? idx}>
                                        <td>{row.student}</td>
                                        <td>{row.course}</td>
                                        <td>
                                            {permissions.viewMatricula !== 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="me-2"
                                                    onClick={() => navigate(`/matriculas/view`, { state: { item: row } })}
                                                >
                                                    Ver
                                                </Button>
                                            )}

                                            {permissions.editMatricula !== 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    className="me-2"
                                                    onClick={() => navigate('/matriculas/edit', { state: { item: row } })}
                                                >
                                                    Editar
                                                </Button>
                                            )}

                                            {permissions.deleteMatricula !== 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => openConfirmDialog(row.id)}
                                                    disabled={deletingId === row.id}
                                                >
                                                    {deletingId === row.id ? '...' : 'Excluir'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {/* Modal de confirmação (substitui confirm global) */}
                    <Modal show={confirmShow} onHide={closeConfirmDialog} backdrop="static" keyboard={false}>
                        <Modal.Header closeButton>
                            <Modal.Title>Confirmar Exclusão</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Tem certeza que deseja excluir esta matrícula?</Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={closeConfirmDialog}>Cancelar</Button>
                            <Button variant="danger" onClick={handleConfirmDelete} disabled={!!deletingId}>
                                {deletingId ? 'Excluindo...' : 'Excluir'}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Container>
            )}
        </>
    );
}
