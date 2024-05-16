---
sidebar_position: 2
---

# Multi-node 클러스터 구축하기

현재 이미 우리는 `k3s-master` 노드를 생성한 상태입니다.  
이 `k3s-master` 노드를 Master node로 하고, 2개의 Worker node를 추가로 구성하여 Multi-node 클러스터를 구축해 보겠습니다.

## Master node의 token 확인하기

`k3s-master` VM Shell에 접속합니다.

```
multipass shell k3s-master
```

Worker node를 생성하기 위해서는 Master node의 IP 주소와 token이 필요합니다.[^1]  
IP 주소는 이미 알고 있는 상태고[^2], token은 다음 명령어로 확인이 가능합니다.

```
sudo cat /var/lib/rancher/k3s/server/node-token
```

이 token 정보를 원하는 방식으로 저장합니다.

## Worker node 생성하기

Worker node는 별도의 VM에 생성하겠습니다.  
Worker node를 위한 새로운 VM을 생성하고 Shell에 접속합니다.

```
multipass launch jammy --name k3s-worker-1 --memory 2G --disk 50G --cpus 2

multipass shell k3s-worker-1
```

VM Shell에서 다음 명령어로 K3S를 설치합니다. Master node의 IP 주소와 token을 여기서 사용합니다.

```
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
K3S_TOKEN=<master-node-token> \
INSTALL_K3S_EXEC="--node-name k3s-worker-1"  sh -
```

동일한 방식으로 `k3s-worker-2` 노드도 생성합니다.

`kubectl get nodes` 명령어를 입력해 다음과 같이 나오면 정상적으로 클러스터가 설정된 것입니다.

```
NAME           STATUS   ROLES                  AGE     VERSION
k3s-worker-1   Ready    <none>                 3m54s   v1.27.7+k3s2
k3s-worker-2   Ready    <none>                 27s     v1.27.7+k3s2
k3s-master     Ready    control-plane,master   23m     v1.27.7+k3s2
```

<br/>

[^1]: https://docs.k3s.io/quick-start#install-script
[^2]: [1. Hello Argo! - K3S 설치하기][step1-3]를 참조해 주세요.

[step1-3]: https://dive-argo.haulrest.me/docs/hello/1-3-install-k3s#vm%EC%9D%98-k8s-%ED%99%98%EA%B2%BD%EC%9D%84-%ED%98%B8%EC%8A%A4%ED%8A%B8%EC%97%90%EC%84%9C-%EC%A0%9C%EC%96%B4%ED%95%98%EA%B8%B0

<!--Re-edited on 240120-->
