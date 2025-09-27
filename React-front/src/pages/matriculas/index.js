import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import DataTable from '../../components/datatable';
import { Client } from '../../api/client'
import { getDataUser } from '../../service/UserService';
import { getPermissions } from '../../service/PermissionService';

export default function Home() {

    const [data, setData] = useState([]);
    const [load, setLoad] = useState(true);
    const navigate = useNavigate();
    const dataUser  = getDataUser();
    const permissions = getPermissions();

    async function fetchData() {
        setLoad(true);
        setTimeout(async () => {
            try {
                const res = await Client.get('matriculas'); // <<< buscou matriculas (corrigido)
                console.log('matriculas response:', res.data);

                // pega array do padrão res.data.data ou res.data
                const raw = res.data?.data ?? res.data ?? [];

                // normaliza pro DataTable: garante campos "student" e "course"
                const mapped = (Array.isArray(raw) ? raw : []).map(item => {
                    // tenta várias formas que o backend pode devolver
                    const alunoObj = item.aluno ?? item.student ?? item.alunoData ?? null;
                    const discObj = item.disciplina ?? item.course ?? item.disciplinaData ?? null;

                    const studentName =
                        alunoObj?.nome ?? alunoObj?.name ?? item.aluno_nome ?? item.student_name ?? String(item.aluno_id ?? item.student_id ?? '');

                    const courseName =
                        discObj?.nome ?? discObj?.name ?? item.disciplina_nome ?? item.course_name ?? item.disciplina?.curso?.nome ?? String(item.disciplina_id ?? item.course_id ?? item.curso_id ?? '');

                    return {
                        ...item,
                        student: studentName,
                        course: courseName
                    };
                });

                console.log('matriculas mapped sample:', mapped[0]);

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
        else if(permissions.listMatricula === 0) navigate(-1); // ajustei para matricula
    }

    useEffect(() => {
        verifyPermission();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <NavigationBar />
            {
                load
                ?
                    <Container className="d-flex justify-content-center mt-5">
                        <OrbitProgress variant="spokes" color="#32cd32" size="medium" text="" textColor="" />
                    </Container>
                :
                    <Container className='mt-2'>
                        <DataTable 
                            title="Matrículas Registradas" 
                            rows={['Estudante', 'Disciplina', 'Ações']}
                            hide={[false, false, false]}
                            data={data}
                            keys={['student', 'course']}            // agora batem com o mapped acima
                            resource='matriculas'                   // recurso correto
                            crud={['viewMatricula', 'createMatricula', 'editMatricula', 'deleteMatricula']} // permissões corretas
                        />
                    </Container>
            }
        </>
    )
}
