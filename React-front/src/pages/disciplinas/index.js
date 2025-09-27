import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import DataTable from '../../components/datatable';
import { Client } from '../../api/client';
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
                const res = await Client.get('disciplinas');
                // mantém o padrão que você usava: res.data.data
                console.log('disciplinas response:', res.data);
                setData(res.data.data ?? res.data ?? []);
            } catch (error) {
                console.error('Erro ao buscar disciplinas:', error);
            } finally {
                setLoad(false);
            }
        }, 1000);
    }

    function verifyPermission() {
        if(!dataUser) navigate('/login'); // não autenticado
        else if(permissions.listDisciplina === 0) navigate(-1); // sem permissão
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
                            title="Disciplinas Registradas" 
                            rows={['Nome', 'Carga Horária (aulas)', 'Ações']}
                            hide={[false, false, false]}              // mostre as colunas (ajuste aqui se quiser esconder a de carga)
                            data={data}
                            keys={['nome', 'carga']}                 // campos que vêm no objeto disciplina
                            resource='disciplinas'
                            // >>> corrigido: permissões para DISCIPLINA (antes estava com Curso)
                            crud={['viewDisciplina', 'createDisciplina', 'editDisciplina', 'deleteDisciplina']}
                        />
                    </Container>
            }
        </>
    )
}
