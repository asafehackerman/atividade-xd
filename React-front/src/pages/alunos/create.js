import { useNavigate } from 'react-router';
import { useState, useEffect, useContext } from 'react';
import { Container } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import { 
    Label,
    Input,
    Select,
    Submit,
} from "./style"
import { Client } from '../../api/client';
// import UserContext from '../../contexts/UserContext'
import { getPermissions } from '../../service/PermissionService';
import { getDataUser } from '../../service/UserService';

export default function Create() {

    const [name, setName] = useState('')
    const [load, setLoad] = useState(true)
    const [data, setData] = useState([])
    const [classHour, setClassHour] = useState(1)
    const [course, setCourse] = useState(0)
    const navigate = useNavigate();
    // const { user } = useContext(UserContext);
    const permissions = getPermissions()
    const dataUser  = getDataUser()
    
    function fetchData() {
    
        setLoad(true) 
        setTimeout(() => {
    
            Client.get('alunos/create').then(res => {
                const cursos = res.data
                console.log(cursos)
                setData(cursos.data)
            })
            .catch(function(error) {
                console.log(error)
            })
            .finally( () => {
                setLoad(false)
            })

        }, 1000)
    }

    function verifyPermission() {
        // Não Autenticado   
        if(!dataUser) navigate('/login')
        // Não Autorizado (rota anterior)
        else if(permissions.createAluno === 0) navigate(-1)
    }

    useEffect(() => {
        verifyPermission()
        fetchData()
    }, []);

    function sendData() {

        const aluno = { nome: name, curso_id: course }
        
        Client.post('alunos', aluno).then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error(error);
        });

        navigate('/alunos')
    }

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
                    <Label>Nome</Label>
                    <Input
                        type="text" 
                        id="name" 
                        name="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Label>Curso</Label>
                    <Select name="course" id="course" onChange={(e) => setCourse(e.target.value)}>
                        {
                            data.map((element, index) => (
                                <option key={index} value={element.id}>
                                    {element.nome}
                                </option>
                            ))
                        }
                    </Select>
                    <Submit value="Voltar" onClick={() => navigate('/alunos')  }/>
                    <Submit value="Cadastrar" onClick={() => sendData() }/>
                </Container>
            }
        </>
    )
    
}